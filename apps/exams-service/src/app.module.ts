import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExamsModule } from './modules/exams/exams.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { QuestionExamsModule } from './modules/question-exams/question-exams.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { SubmissionAnswersModule } from './modules/submission-answers/submission-answers.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ExamsModule,
    QuestionsModule,
    QuestionExamsModule,
    SubmissionsModule,
    SubmissionAnswersModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
