import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QuestionExamsService } from './question-exams.service';
import { CreateQuestionExamDto, UpdateQuestionExamDto } from './dto';

@Controller('question-exams')
export class QuestionExamsController {
  constructor(private readonly questionExamsService: QuestionExamsService) {}

  @MessagePattern('get_hello_word_question_exam')
  async getHelloWordQuestionExam(@Payload() data: { questionId: number, examId: number }) {
    return `Hello from question ${data.questionId} in exam ${data.examId}`;
  }
}