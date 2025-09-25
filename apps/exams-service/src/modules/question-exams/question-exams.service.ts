import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionExamDto, UpdateQuestionExamDto } from './dto';

@Injectable()
export class QuestionExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuestionExam(createDto: CreateQuestionExamDto) {
    return this.prisma.questionExam.create({
      data: createDto,
      include: {
        question: true,
        exam: true,
      },
    });
  }

  async findQuestionExam(questionId: number, examId: number) {
    const questionExam = await this.prisma.questionExam.findUnique({
      where: { 
        question_id_exam_id: {
          question_id: questionId,
          exam_id: examId,
        },
      },
      include: {
        question: true,
        exam: true,
      },
    });

    if (!questionExam) {
      throw new NotFoundException(`Question-Exam relationship not found`);
    }

    return questionExam;
  }

  async updateQuestionExam(questionId: number, examId: number, updateDto: UpdateQuestionExamDto) {
    const questionExam = await this.findQuestionExam(questionId, examId);
    return this.prisma.questionExam.update({
      where: { 
        question_id_exam_id: {
          question_id: questionId,
          exam_id: examId,
        },
      },
      data: updateDto,
      include: {
        question: true,
        exam: true,
      },
    });
  }

  async deleteQuestionExam(questionId: number, examId: number): Promise<void> {
    const questionExam = await this.findQuestionExam(questionId, examId);
    await this.prisma.questionExam.delete({
      where: { 
        question_id_exam_id: {
          question_id: questionId,
          exam_id: examId,
        },
      },
    });
  }

  async findQuestionsByExam(examId: number) {
    return this.prisma.questionExam.findMany({
      where: { exam_id: examId },
      include: {
        question: true,
      },
    });
  }

  async findExamsByQuestion(questionId: number) {
    return this.prisma.questionExam.findMany({
      where: { question_id: questionId },
      include: {
        exam: true,
      },
    });
  }
}
