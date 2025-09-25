import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuestion(createQuestionDto: CreateQuestionDto) {
    return this.prisma.question.create({
      data: createQuestionDto,
      include: {
        question_exams: {
          include: {
            exam: true,
          },
        },
        submission_answers: true,
      },
    });
  }

  async findAllQuestions(type?: string) {
    return this.prisma.question.findMany({
      where: type ? { type } : undefined,
      include: {
        question_exams: {
          include: {
            exam: true,
          },
        },
        submission_answers: true,
      },
    });
  }

  async findQuestionById(id: number) {
    const question = await this.prisma.question.findUnique({
      where: { question_id: id },
      include: {
        question_exams: {
          include: {
            exam: true,
          },
        },
        submission_answers: true,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return question;
  }

  async updateQuestion(id: number, updateQuestionDto: UpdateQuestionDto) {
    const question = await this.findQuestionById(id);
    return this.prisma.question.update({
      where: { question_id: id },
      data: updateQuestionDto,
      include: {
        question_exams: {
          include: {
            exam: true,
          },
        },
        submission_answers: true,
      },
    });
  }

  async deleteQuestion(id: number): Promise<void> {
    const question = await this.findQuestionById(id);
    await this.prisma.question.delete({
      where: { question_id: id },
    });
  }

  async findQuestionsByExam(examId: number) {
    return this.prisma.question.findMany({
      where: {
        question_exams: {
          some: {
            exam_id: examId,
          },
        },
      },
      include: {
        question_exams: {
          include: {
            exam: true,
          },
        },
        submission_answers: true,
      },
    });
  }
}
