import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Настройка пула соединений
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // максимальное количество соединений
      idleTimeoutMillis: 30000,
    });

    // Создание адаптера
    const adapter = new PrismaPg(pool);

    // Инициализация клиента с адаптером
    super({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma Client connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Prisma Client disconnected from database');
  }
}
