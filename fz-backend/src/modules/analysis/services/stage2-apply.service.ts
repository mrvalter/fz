// src/modules/analysis/services/stage2-apply.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { Stage2ResponseDto } from '../dto/stage2-response.dto';
import { ChangeInstruction, AppliedChange } from '../interfaces/change-instruction.interface';
import { STAGE2_APPLY_PROMPT } from '../prompts/stage2-apply.prompt';
import { SYSTEM_PROMPT_STAGE2 } from '../prompts/system-prompts';

import { DeepSeekService } from './deepseek.service';
import { FileLoaderService } from './file-loader.service';
import { JsonValidatorService } from './json-validator.service';

@Injectable()
export class Stage2ApplyService {
  private readonly logger = new Logger(Stage2ApplyService.name);

  constructor(
    private readonly deepseekService: DeepSeekService,
    private readonly fileLoaderService: FileLoaderService,
    private readonly jsonValidator: JsonValidatorService,
  ) {}

  async applyChanges(
    projectId: string,
    changes: ChangeInstruction[],
    model: string = 'deepseek-v3.1',
    reasoningEffort: 'low' | 'medium' | 'high' = 'medium',
  ): Promise<Stage2ResponseDto> {
    const startTime = Date.now();
    this.logger.log(`Stage 2: Applying ${changes.length} changes for project ${projectId}`);

    const appliedChanges: AppliedChange[] = [];
    let tokensUsed = 0;

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      this.logger.debug(
        `Applying change ${i + 1}/${changes.length}: ${change.type} on ${change.article}`,
      );

      try {
        const result = await this.applySingleChange(projectId, change, model, reasoningEffort);
        appliedChanges.push(result);
        tokensUsed += result.success ? 1000 : 0;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        this.logger.error(`Failed to apply change on ${change.article}: ${errorMessage}`);
        appliedChanges.push({
          type: change.type,
          chapter: change.chapter,
          article: change.article,
          oldContent: '',
          newContent: '',
          success: false,
          error: errorMessage,
        });
      }
    }

    const successCount = appliedChanges.filter((c) => c.success).length;
    this.logger.log(
      `Stage 2 completed: ${successCount}/${changes.length} changes applied successfully`,
    );

    return {
      success: successCount === changes.length,
      changes: appliedChanges,
      tokensUsed,
      processingTimeMs: Date.now() - startTime,
    };
  }

  private async applySingleChange(
    projectId: string,
    change: ChangeInstruction,
    model: string,
    reasoningEffort: 'low' | 'medium' | 'high',
  ): Promise<AppliedChange> {
    try {
      // 1. Загружаем оригинальную статью
      const oldContent = await this.fileLoaderService.loadOriginalArticle(
        projectId,
        change.chapter,
        change.article,
      );

      // 2. Для delete типа, нет нового контента
      if (change.type === 'delete') {
        return {
          type: change.type,
          chapter: change.chapter,
          article: change.article,
          oldContent,
          newContent: '',
          success: true,
        };
      }

      // 3. Для replace/add — отправляем запрос в DeepSeek
      const newContentFromBill = change.newContent || '';

      const response = await this.deepseekService.chatCompletion({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_STAGE2 },
          { role: 'user', content: STAGE2_APPLY_PROMPT(oldContent, newContentFromBill) },
        ],
        temperature: 0.0,
        max_tokens: 8192,
        reasoning_effort: reasoningEffort,
      });

      // 4. Валидируем ответ
      const updatedArticle = this.jsonValidator.validateAppliedArticle(response);

      return {
        type: change.type,
        chapter: change.chapter,
        article: change.article,
        oldContent,
        newContent: updatedArticle,
        success: !!updatedArticle,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to apply change: ${errorMessage}`);
    }
  }
}
