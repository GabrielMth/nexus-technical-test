// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL not define in dot env = .env');
    }

    const adapter = new PrismaPg({ connectionString });

    super({ adapter } as unknown as ConstructorParameters<
      typeof PrismaClient
    >[0]);
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Connect DB failed:', err.message);
      } else {
        console.error('Error connect with db:', err);
      }
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Erro disconnect db:', err.message);
      } else {
        console.error('Unknow error disconnect db:', err);
      }
    }
  }
}
