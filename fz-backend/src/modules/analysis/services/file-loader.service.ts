// src/modules/analysis/services/file-loader.service.ts

import * as fs from 'fs';
import * as path from 'path';

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileLoaderService {
  private readonly logger = new Logger(FileLoaderService.name);
  private readonly uploadsPath: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadsPath = this.configService.get<string>('UPLOADS_PATH') || './uploads';
  }

  getProjectFilePath(projectId: string): string {
    return path.join(this.uploadsPath, 'projects', projectId, 'proekt.docx');
  }

  async loadProjectLawText(projectId: string): Promise<string> {
    const filePath = path.join(this.uploadsPath, 'projects', projectId, 'proekt.docx');
    return this.extractTextFromFile(filePath);
  }

  async loadOriginalLawText(projectId: string): Promise<string> {
    const filePath = path.join(this.uploadsPath, 'projects', projectId, 'original-law.pdf');
    return this.extractTextFromFile(filePath);
  }

  async loadOriginalArticle(
    projectId: string,
    chapter: string | undefined,
    article: string,
  ): Promise<string> {
    const fullText = await this.loadOriginalLawText(projectId);
    return this.extractArticleByNumber(fullText, article, chapter);
  }

  private async extractTextFromFile(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new HttpException(`File not found: ${filePath}`, HttpStatus.NOT_FOUND);
    }

    try {
      const dataBuffer = fs.readFileSync(filePath);

      // ✅ Используем динамический импорт для ESM модуля
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(dataBuffer);

      this.logger.debug(`Extracted ${pdfData.text.length} chars from ${filePath}`);
      return pdfData.text;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to extract text from PDF: ${errorMessage}`);
      throw new HttpException(
        `Failed to extract text from PDF: ${errorMessage}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  private extractArticleByNumber(text: string, articleNumber: string, chapter?: string): string {
    const articlePattern = new RegExp(
      `${chapter ? `${chapter}\\s+` : ''}Статья\\s+${articleNumber}\\s*([\\s\\S]*?)(?=Статья\\s+\\d+|$)`,
      'i',
    );

    const match = text.match(articlePattern);
    if (!match) {
      throw new HttpException(
        `Article ${articleNumber} not found in the law text`,
        HttpStatus.NOT_FOUND,
      );
    }

    return match[1]?.trim() || '';
  }

  async saveExtractedText(
    projectId: string,
    type: 'original' | 'project',
    text: string,
  ): Promise<void> {
    const dirPath = path.join(this.uploadsPath, 'projects', projectId, 'extracted-texts');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, `${type}.txt`);
    fs.writeFileSync(filePath, text, 'utf-8');
    this.logger.debug(`Saved extracted text for ${type} to ${filePath}`);
  }
}
