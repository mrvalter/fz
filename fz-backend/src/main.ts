// src/main.ts

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

    // Регистрируем плагин для обработки файлов
    await app.register(multipart, {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB лимит
        },
    });

    // Глобальная валидация DTO
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    // Настройка Swagger документации
    const config = new DocumentBuilder()
        .setTitle('FZ Backend API')
        .setDescription('API для анализа законопроектов с использованием DeepSeek AI')
        .setVersion('1.0')
        .addTag('app', 'Общая информация о сервере')
        .addTag('analysis', 'Анализ законопроектов через DeepSeek AI')
        .addTag('projects', 'Управление проектами')
        .addBearerAuth() // если будете использовать аутентификацию
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document); // Swagger UI будет доступен по пути /api/docs

    await app.listen(3000, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
    console.log(`Swagger documentation: ${await app.getUrl()}/api/docs`);
}
bootstrap();
