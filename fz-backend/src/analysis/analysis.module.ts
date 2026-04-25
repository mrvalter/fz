import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AnalysisController } from './controllers/analysis.controller';
import { AnalysisService } from './services/analysis.service';
import { DeepSeekService } from './services/deepseek.service';
import { FileLoaderService } from './services/file-loader.service';
import { JsonValidatorService } from './services/json-validator.service';
import { Stage1ExtractService } from './services/stage1-extract.service';
import { Stage2ApplyService } from './services/stage2-apply.service';
import { DocxService } from '@/docx/docx.service'
import { FileStorageService } from '@/common/services/file-storage.service';

@Module({
    imports: [
        HttpModule.register({
            timeout: 120000, // 2 минуты таймаут для DeepSeek API
            maxRedirects: 5,
        }),
        ConfigModule,
    ],
    controllers: [AnalysisController],
    providers: [
        AnalysisService,
        DeepSeekService,
        Stage1ExtractService,
        Stage2ApplyService,
        FileLoaderService,
        JsonValidatorService,
        DocxService,
        FileStorageService
    ],
    exports: [AnalysisService],
})
export class AnalysisModule { }
