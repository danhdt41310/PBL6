import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SubmissionAnswersService } from './submission-answers.service';
import { CreateSubmissionAnswerDto, UpdateSubmissionAnswerDto } from './dto';

@Controller('submission-answers')
export class SubmissionAnswersController {
  constructor(private readonly submissionAnswersService: SubmissionAnswersService) {}

  @MessagePattern('get_submission_answer_hello_word')
  async getSubmissionAnswerHelloWord(@Payload() data: { submissionId: number, answerId: number }) {
    return `Hello from answer ${data.answerId} in submission ${data.submissionId}`;
  }
}