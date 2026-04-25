// src/modules/analysis/services/stage1-extract.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { Stage1ResponseDto } from '../dto/stage1-response.dto';
import { STAGE1_EXTRACT_PROMPT } from '../prompts/stage1-extract.prompt';
import { SYSTEM_PROMPT_STAGE1 } from '../prompts/system-prompts';

import { DeepSeekService } from './deepseek.service';
import { FileLoaderService } from './file-loader.service';
//import { JsonValidatorService } from './json-validator.service';
import { DeepSeekRequest } from '../interfaces/deepseek-response.interface';
import { FileStorageService } from '@/common/services/file-storage.service';

@Injectable()
export class Stage1ExtractService {
    private readonly logger = new Logger(Stage1ExtractService.name);

    constructor(
        private readonly deepseekService: DeepSeekService,
        private readonly fileLoaderService: FileLoaderService,
        //private readonly jsonValidator: JsonValidatorService,
        private readonly fileStorage: FileStorageService
    ) { }

    async extractChanges(
        projectId: string,
        model: string = 'deepseek-v3.2-exp',
    ): Promise<Stage1ResponseDto | any> {
        const startTime = Date.now();
        this.logger.log(`Stage 1: Extracting changes for project ${projectId}`);

        this.logger.log(`start request stage1 model ${model}`, model);

        try {

            // 1. Загружаем текст законопроекта
            const projectLawText = await this.fileLoaderService.loadProjectLawText(projectId);

            this.logger.log(`exporting text from file length: ${projectLawText.length}`);

            // 2. Сохраняем извлечённый текст для отладки11
            //await this.fileLoaderService.saveExtractedText(projectId, 'project', projectLawText);                      

            // 3. Отправляем запрос в DeepSeek
            const deepseekDataRequest: DeepSeekRequest = {
                model: "deepseek-v4-pro", //model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT_STAGE1 },
                    { role: 'user', content: `${STAGE1_EXTRACT_PROMPT}\n\nТекст законопроекта:\n${projectLawText}` },
                ],
                temperature: 0.0,
                thinking: { "type": "enabled" },
                reasoning_effort: "high",
                stream: false,
            };

            this.logger.log("Stage 1 deepseek promts", deepseekDataRequest);

            const response = await this.deepseekService.chatCompletion(deepseekDataRequest);

            //сохраняем responce в файл
            const savedFile = await this.fileStorage.saveResponseToFile(response, {
                filename: `deepseek_analysis_${Date.now()}.json`,
                subfolder: `deepseek-responses/${projectId}`,
                metadata: {
                    responseLength: response.length,
                    responseTime: new Date().toISOString(),
                }
            });

            console.log(`✅ Ответ сохранен: ${savedFile.filepath}`);
            console.log(`📄 Размер файла: ${savedFile.size} bytes`);

            this.logger.log("result", deepseekDataRequest);

            // 4. Валидируем JSON ответ
            //const changes = this.jsonValidator.validateExtractedChanges(response);

            //this.logger.log(`Stage 1 completed: found ${changes.length} changes`);

            return {
                success: true,
                changes: [response],
                tokensUsed: 0,
                processingTimeMs: Date.now() - startTime,
                error: "",
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this.logger.error(`Stage 1 failed: ${errorMessage}`);
            return {
                success: false,
                changes: [],
                tokensUsed: 0,
                processingTimeMs: Date.now() - startTime,
                error: errorMessage,
            };
        }
    }
}
