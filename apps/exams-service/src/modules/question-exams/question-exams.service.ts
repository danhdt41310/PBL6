import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionExamsRepository } from './question-exams.repository';
import { CreateQuestionExamDto, UpdateQuestionExamDto } from './dto';

@Injectable()
export class QuestionExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionExamsRepository: QuestionExamsRepository,
  ) {}

  async createQuestionExam(createDto: CreateQuestionExamDto) {
    return this.questionExamsRepository.create(createDto);
  }

  async findQuestionExam(questionId: number, examId: number) {
    const questionExam = await this.questionExamsRepository.findUnique(questionId, examId);

    if (!questionExam) {
      throw new NotFoundException(`Question-Exam relationship not found`);
    }

    return questionExam;
  }

  async updateQuestionExam(questionId: number, examId: number, updateDto: UpdateQuestionExamDto) {
    const questionExam = await this.findQuestionExam(questionId, examId);
    return this.questionExamsRepository.update(questionId, examId, updateDto);
  }

  async deleteQuestionExam(questionId: number, examId: number): Promise<void> {
    const questionExam = await this.findQuestionExam(questionId, examId);
    await this.questionExamsRepository.delete(questionId, examId);
  }

  async findQuestionsByExam(examId: number) {
    return this.questionExamsRepository.findManyByExam(examId);
  }

  async findExamsByQuestion(questionId: number) {
    return this.questionExamsRepository.findManyByQuestion(questionId);
  }
}
