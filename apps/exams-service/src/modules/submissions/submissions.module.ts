import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { SubmissionsRepository } from './submissions.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { ExamsModule } from '../exams/exams.module';

@Module({
  imports: [
    ExamsModule,
    ClientsModule.registerAsync([
      {
        name: 'USERS_SERVICE',
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
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionsRepository, PrismaService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
