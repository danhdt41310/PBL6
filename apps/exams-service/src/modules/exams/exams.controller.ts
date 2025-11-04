import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ExamsService } from './exams.service';
import { CreateExamDto, UpdateExamDto, ExamFilterDto } from './dto/create-exam.dto';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @MessagePattern('exams.create')
  async createExam(@Payload() createExamDto: CreateExamDto) {
    return await this.examsService.createExam(createExamDto);
  }

  @MessagePattern('exams.findAll')
  async findAllExams(@Payload() filterDto: ExamFilterDto) {
    return await this.examsService.findAll(filterDto);
  }

  @MessagePattern('exams.findOne')
  async findExamById(@Payload() data: { id: number }) {
    return await this.examsService.findOne(data.id);
  }

  @MessagePattern('exams.update')
  async updateExam(@Payload() data: { id: number; updateExamDto: UpdateExamDto }) {
    return await this.examsService.updateExam(data.id, data.updateExamDto);
  }

  @MessagePattern('exams.delete')
  async deleteExam(@Payload() data: { id: number }) {
    return await this.examsService.deleteExam(data.id);
  }

  @MessagePattern('exams.get_hello')
  async getExamHelloWord(@Payload() data: { examId: number }) {
    return `Hello from exam ${data.examId}`;
  }
}
