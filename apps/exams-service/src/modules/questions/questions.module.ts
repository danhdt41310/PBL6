import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, PrismaService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
