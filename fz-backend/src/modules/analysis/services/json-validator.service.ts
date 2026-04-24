// src/modules/analysis/services/json-validator.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { ChangeInstruction } from '../interfaces/change-instruction.interface';

@Injectable()
export class JsonValidatorService {
  private readonly logger = new Logger(JsonValidatorService.name);

  validateExtractedChanges(jsonString: string): ChangeInstruction[] {
    try {
      // Очищаем строку от возможных markdown-обёрток
      let cleanJson = jsonString.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanJson);

      if (!parsed.changes || !Array.isArray(parsed.changes)) {
        this.logger.warn('Invalid changes format: missing "changes" array');
        return [];
      }

      const validChanges: ChangeInstruction[] = [];
      for (const change of parsed.changes) {
        if (change.type && change.article) {
          validChanges.push({
            type: change.type,
            chapter: change.chapter,
            article: change.article,
            newContent: change.newContent || change.content,
            deletedContent: change.deletedContent,
          });
        } else {
          this.logger.warn(`Skipping invalid change: ${JSON.stringify(change)}`);
        }
      }

      return validChanges;
    } catch (error) {
      // ✅ Исправлено: проверяем тип error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Failed to parse JSON: ${errorMessage}`);
      this.logger.debug(`Raw JSON string: ${jsonString.substring(0, 500)}`);
      if (errorStack) {
        this.logger.debug(`Stack trace: ${errorStack}`);
      }
      return [];
    }
  }

  validateAppliedArticle(jsonString: string): string {
    try {
      let cleanJson = jsonString.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanJson);
      return parsed.updatedArticle || '';
    } catch (error) {
      // ✅ Исправлено: проверяем тип error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to parse applied article JSON: ${errorMessage}`);
      this.logger.debug(`Raw JSON string: ${jsonString.substring(0, 500)}`);
      return '';
    }
  }
}
