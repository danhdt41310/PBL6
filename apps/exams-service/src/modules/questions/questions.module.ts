import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsImportService } from './questions-import.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionService } from '../../prisma/transaction.service';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsImportService, PrismaService, TransactionService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
