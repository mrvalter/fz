// src/modules/analysis/dto/start-analysis.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsIn, IsNumber } from 'class-validator';

export class StartAnalysisDto {
  @ApiProperty({ description: 'ID проекта' })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description: 'Модель для этапа извлечения',
    required: false,
    default: 'deepseek-v3.2-exp',
  })
  @IsOptional()
  @IsString()
  stage1Model?: string = 'deepseek-v3.2-exp'; // ← значение по умолчанию

  @ApiProperty({
    description: 'Модель для этапа применения',
    required: false,
    default: 'deepseek-v3.1',
  })
  @IsOptional()
  @IsString()
  stage2Model?: string = 'deepseek-v3.1'; // ← значение по умолчанию

  @ApiProperty({
    description: 'Режим рассуждения для V3.1',
    required: false,
    default: 'medium',
    enum: ['low', 'medium', 'high'],
  })
  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  reasoningEffort?: 'low' | 'medium' | 'high' = 'medium'; // ← значение по умолчанию
}
