import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasourceUrl: process.env.USERS_DATABASE_URL,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
