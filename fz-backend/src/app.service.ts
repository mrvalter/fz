// src/app.service.ts

import { Injectable } from '@nestjs/common';

import * as packageJson from '../package.json';

@Injectable()
export class AppService {
    private readonly startTime = Date.now();

    getInfo() {
        return {
            name: packageJson.name || 'FZ Backend API',
            version: packageJson.version || '1.0.0',
            description: 'API для анализа законопроектов с использованием DeepSeek AI',
            environment: process.env.NODE_ENV || 'development',
            uptime: this.getUptime(),
            features: [
                'Загрузка законов и законопроектов',
                'Двухэтапный анализ изменений через DeepSeek AI',
                'Постатейное применение изменений',
                'JSON вывод с точными инструкциями',
            ],
            endpoints: {
                health: '/health',
                projects: '/projects',
                analysis: '/analysis',
            },
        };
    }

    healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: this.getUptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform,
        };
    }

    private getUptime(): string {
        const uptimeMs = Date.now() - this.startTime;
        const seconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}д ${hours % 24}ч`;
        if (hours > 0) return `${hours}ч ${minutes % 60}м`;
        if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
        return `${seconds}с`;
    }
}
