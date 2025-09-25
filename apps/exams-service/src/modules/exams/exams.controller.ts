import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ExamsService } from './exams.service';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @MessagePattern('exams.get_hello')
  async getExamHelloWord(@Payload() data: { examId: number }) {
    return `Hello from exam ${data.examId}`;
  }
}
