// src/app.controller.ts

import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    @ApiOperation({ summary: 'Получить информацию о сервере' })
    @ApiResponse({ status: 200, description: 'Информация о сервере успешно получена' })
    getInfo() {
        return this.appService.getInfo();
    }

    @Get('health')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Проверка здоровья сервера' })
    @ApiResponse({ status: 200, description: 'Сервер работает' })
    healthCheck() {
        return this.appService.healthCheck();
    }

    @Get('ping')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Проверка доступности сервера' })
    ping() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'pong',
        };
    }
}
