// src/modules/analysis/controllers/analysis.controller.ts

import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

import { FinalResultDto } from '../dto/final-result.dto';
import { StartAnalysisDto } from '../dto/start-analysis.dto';
import { AnalysisService } from '../services/analysis.service';

@ApiTags('analysis') // ← Группирует все эндпоинты этого контроллера в Swagger UI
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Запустить анализ законопроекта',
    description:
      'Запускает двухэтапный процесс анализа: 1) извлечение изменений из законопроекта, 2) постатейное применение изменений к закону',
  })
  @ApiBody({ type: StartAnalysisDto })
  @ApiResponse({ status: 202, description: 'Анализ успешно запущен', type: Object })
  @ApiResponse({ status: 400, description: 'Неверные параметры запроса' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  async startAnalysis(@Body() dto: StartAnalysisDto) {
    return this.analysisService.startAnalysis(dto);
  }

  @Get(':projectId/progress')
  @ApiOperation({
    summary: 'Получить статус обработки',
    description:
      'Возвращает текущий статус анализа: pending, extracting, applying, completed, failed',
  })
  @ApiParam({
    name: 'projectId',
    description: 'UUID проекта',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Статус успешно получен' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  async getProgress(@Param('projectId') projectId: string) {
    const progress = await this.analysisService.getProgress(projectId);
    if (!progress) {
      return { projectId, status: 'not_found' };
    }
    return progress;
  }

  @Get(':projectId/result')
  @ApiOperation({
    summary: 'Получить финальный результат',
    description: 'Возвращает JSON со всеми изменениями и итоговым текстом закона',
  })
  @ApiParam({ name: 'projectId', description: 'UUID проекта' })
  @ApiResponse({ status: 200, description: 'Результат успешно получен', type: Object })
  @ApiResponse({ status: 404, description: 'Проект или результат не найден' })
  async getResult(@Param('projectId') projectId: string) {
    const progress = await this.analysisService.getProgress(projectId);
    return progress?.result || null;
  }
}
