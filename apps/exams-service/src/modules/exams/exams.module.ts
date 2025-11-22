import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingService } from 'src/embedding/embedding.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'CLASSES_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.REDIS,
          options: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [ExamsController],
  providers: [ExamsService, PrismaService, EmbeddingService],
  exports: [ExamsService, EmbeddingService],
})
export class ExamsModule {}
