// src/modules/analysis/services/stage1-extract.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { Stage1ResponseDto } from '../dto/stage1-response.dto';
import { STAGE1_EXTRACT_PROMPT } from '../prompts/stage1-extract.prompt';
import { SYSTEM_PROMPT_STAGE1 } from '../prompts/system-prompts';

import { DeepSeekService } from './deepseek.service';
import { FileLoaderService } from './file-loader.service';
import { JsonValidatorService } from './json-validator.service';

@Injectable()
export class Stage1ExtractService {
  private readonly logger = new Logger(Stage1ExtractService.name);

  constructor(
    private readonly deepseekService: DeepSeekService,
    private readonly fileLoaderService: FileLoaderService,
    private readonly jsonValidator: JsonValidatorService,
  ) {}

  async extractChanges(
    projectId: string,
    model: string = 'deepseek-v3.2-exp',
  ): Promise<Stage1ResponseDto | any> {
    const startTime = Date.now();
    this.logger.log(`Stage 1: Extracting changes for project ${projectId}`);

    try {
      // 1. Загружаем текст законопроекта
      //const projectLawText = await this.fileLoaderService.loadProjectLawText(projectId);
      const projectLawFilePath = this.fileLoaderService.getProjectFilePath(projectId);      

      const responseFileUpload = await this.deepseekService.uploadFile(projectLawFilePath, 'project-file.docx');
      
      this.logger.log('reponse file upload', responseFileUpload);
      
      // 2. Сохраняем извлечённый текст для отладки
      //await this.fileLoaderService.saveExtractedText(projectId, 'project', projectLawText);
      const changes = responseFileUpload;
      return {
        success: !!changes,
        changes,
        tokensUsed: 0,
        processingTimeMs: Date.now() - startTime,
      };

      // 3. Отправляем запрос в DeepSeek
      /**const response = await this.deepseekService.chatCompletion({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_STAGE1 },
          { role: 'user', content: `${STAGE1_EXTRACT_PROMPT}\n\nЗаконопроект:\n${projectLawText}` },
        ],
        temperature: 0.0,
        max_tokens: 16384,
      });

      // 4. Валидируем JSON ответ
      //const changes = this.jsonValidator.validateExtractedChanges(response);

     // this.logger.log(`Stage 1 completed: found ${changes.length} changes`);
      */
     
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
