import { Module } from '@nestjs/common';
import { SubmissionAnswersController } from './submission-answers.controller';
import { SubmissionAnswersService } from './submission-answers.service';
import { SubmissionAnswersRepository } from './submission-answers.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [SubmissionAnswersController],
  providers: [SubmissionAnswersService, SubmissionAnswersRepository, PrismaService],
  exports: [SubmissionAnswersService],
})
export class SubmissionAnswersModule {}
