import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getErrorMessage } from '@/common/utils/error.util';

@Injectable()
export class FileStorageService {
    private readonly logger = new Logger(FileStorageService.name);
    private readonly uploadDir = 'uploads';

    constructor() {
        this.ensureUploadDirectory();
    }

    /**
     * Создает директорию uploads, если она не существует
     */
    private async ensureUploadDirectory(): Promise<void> {
        try {
            await fs.access(this.uploadDir);
        } catch {
            this.logger.log(`Creating uploads directory: ${this.uploadDir}`);
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Сохраняет текстовый ответ в файл
     */
    async saveResponseToFile(
        content: string,
        options?: {
            filename?: string;
            subfolder?: string;
            metadata?: any;
        }
    ): Promise<{
        filepath: string;
        filename: string;
        size: number;
    }> {
        try {
            // Генерируем уникальное имя файла
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const uniqueId = uuidv4().slice(0, 8);
            const filename = options?.filename || `deepseek-response_${timestamp}_${uniqueId}.json`;

            // Определяем путь к файлу
            let targetDir = this.uploadDir;
            if (options?.subfolder) {
                targetDir = join(this.uploadDir, options.subfolder);
                await fs.mkdir(targetDir, { recursive: true });
            }

            const filepath = join(targetDir, filename);

            // Подготавливаем данные для сохранения
            const dataToSave = {
                timestamp: new Date().toISOString(),
                response: JSON.parse(content),
                metadata: options?.metadata || {},
                filename: filename,
            };

            // Сохраняем в JSON формате
            await fs.writeFile(filepath, JSON.stringify(dataToSave, null, 2), 'utf-8');

            // Получаем размер файла
            const stats = await fs.stat(filepath);

            this.logger.log(`Response saved to: ${filepath} (${stats.size} bytes)`);

            return {
                filepath,
                filename,
                size: stats.size,
            };
        } catch (error) {
            this.logger.error(`Failed to save response: ${getErrorMessage(error)}`);
            throw new BadRequestException('Не удалось сохранить ответ');
        }
    }

    /**
     * Сохраняет как JSON с pretty formatting
     */
    async saveAsJson(data: any, filename?: string): Promise<string> {
        const filepath = join(this.uploadDir, filename || `data_${Date.now()}.json`);
        await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
        this.logger.log(`JSON saved to: ${filepath}`);
        return filepath;
    }

    /**
     * Сохраняет как обычный текст
     */
    async saveAsText(content: string, filename?: string): Promise<string> {
        const filepath = join(this.uploadDir, filename || `output_${Date.now()}.txt`);
        await fs.writeFile(filepath, content, 'utf-8');
        this.logger.log(`Text saved to: ${filepath}`);
        return filepath;
    }

    /**
     * Получает список всех сохраненных ответов
     */
    async listSavedResponses(subfolder?: string): Promise<string[]> {
        const targetDir = subfolder ? join(this.uploadDir, subfolder) : this.uploadDir;

        try {
            const files = await fs.readdir(targetDir);
            return files.filter(file => file.endsWith('.json') || file.endsWith('.txt'));
        } catch (error) {
            this.logger.error(`Failed to list files: ${getErrorMessage(error)}`);
            return [];
        }
    }

    /**
     * Читает сохраненный ответ из файла
     */
    async readSavedResponse(filename: string, subfolder?: string): Promise<any> {
        const targetDir = subfolder ? join(this.uploadDir, subfolder) : this.uploadDir;
        const filepath = join(targetDir, filename);

        try {
            const content = await fs.readFile(filepath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            this.logger.error(`Failed to read file: ${getErrorMessage(error)}`);
            throw new BadRequestException('Файл не найден');
        }
    }
}