import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { getErrorMessage } from '../common/utils/error.util';

@Injectable()
export class DocxService {
    private readonly logger = new Logger(DocxService.name);

    /**
     * Извлечение текста из Buffer (для Fastify)
     */
    async extractTextFromBuffer(fileBuffer: Buffer): Promise<string> {
        try {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            return result.value;
        } catch (error) {
            this.logger.error(`Ошибка извлечения текста: ${getErrorMessage(error)}`);
            throw new Error('Не удалось обработать DOCX файл');
        }
    }

    /**
     * Получение текста с HTML-разметкой
     */
    async extractHtmlFromBuffer(fileBuffer: Buffer): Promise<string> {
        try {
            const result = await mammoth.convertToHtml({ buffer: fileBuffer });
            return result.value;
        } catch (error) {
            this.logger.error(`Ошибка преобразования в HTML: ${getErrorMessage(error)}`);
            throw new Error('Не удалось обработать DOCX файл');
        }
    }
}