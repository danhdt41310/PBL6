import { Module } from '@nestjs/common';
import { SubmissionAnswersController } from './submission-answers.controller';
import { SubmissionAnswersService } from './submission-answers.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [SubmissionAnswersController],
  providers: [SubmissionAnswersService, PrismaService],
  exports: [SubmissionAnswersService],
})
export class SubmissionAnswersModule {}
