import { Module } from '@nestjs/common';
import { QuestionExamsController } from './question-exams.controller';
import { QuestionExamsService } from './question-exams.service';
import { QuestionExamsRepository } from './question-exams.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [QuestionExamsController],
  providers: [QuestionExamsService, QuestionExamsRepository, PrismaService],
  exports: [QuestionExamsService],
})
export class QuestionExamsModule {}
