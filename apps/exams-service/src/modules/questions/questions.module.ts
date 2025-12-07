import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './questions.repository';
import { QuestionsImportService } from './questions-import.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionService } from '../../prisma/transaction.service';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsRepository, QuestionsImportService, PrismaService, TransactionService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
