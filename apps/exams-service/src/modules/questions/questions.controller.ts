import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';


@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @MessagePattern('get_question_hello_word')
  async getQuestionHelloWord(@Payload() data: { questionId: number }) {
    return `Hello from question ${data.questionId}`;
  }
}
