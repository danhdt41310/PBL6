import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/users-client';
import { IPrismaService } from '@repo/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, IPrismaService {
  // Add index signature for IPrismaService compatibility
  [key: string]: any;

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}