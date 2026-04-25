// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalysisModule } from './analysis/analysis.module'; // ← импортируем модуль
import { DocxModule } from './docx/docx.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        AnalysisModule, // ← подключаем модуль анализа
        DocxModule, // // ← подключаем модуль парсинга документов
        // ProjectsModule, // позже добавим
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
