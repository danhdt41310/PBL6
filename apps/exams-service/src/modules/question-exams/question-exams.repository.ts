import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionExamDto, UpdateQuestionExamDto } from './dto';

@Injectable()
export class QuestionExamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateQuestionExamDto) {
    return this.prisma.questionExam.create({
      data: createDto,
      include: {
        question: true,
        exam: true,
      },
    });
  }

  async findUnique(questionId: number, examId: number) {
    return this.prisma.questionExam.findUnique({
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
  }

  async update(questionId: number, examId: number, updateDto: UpdateQuestionExamDto) {
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

  async delete(questionId: number, examId: number) {
    return this.prisma.questionExam.delete({
      where: { 
        question_id_exam_id: {
          question_id: questionId,
          exam_id: examId,
        },
      },
    });
  }

  async findManyByExam(examId: number) {
    return this.prisma.questionExam.findMany({
      where: { exam_id: examId },
      include: {
        question: true,
      },
    });
  }

  async findManyByQuestion(questionId: number) {
    return this.prisma.questionExam.findMany({
      where: { question_id: questionId },
      include: {
        exam: true,
      },
    });
  }
}
