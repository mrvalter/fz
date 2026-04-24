// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalysisModule } from './modules/analysis/analysis.module'; // ← импортируем модуль

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AnalysisModule, // ← подключаем модуль анализа
    // ProjectsModule, // позже добавим
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
