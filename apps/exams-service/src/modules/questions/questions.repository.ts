import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionCategoryDto, CreateQuestionDto, UpdateQuestionDto } from './dto';

@Injectable()
export class QuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // QUESTION CATEGORIES
  // ============================================================
  async createCategory(createCategoryDto: CreateQuestionCategoryDto) {
    return this.prisma.questionCategory.create({
      data: createCategoryDto,
    });
  }

  async findManyCategories(where: any) {
    return this.prisma.questionCategory.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  async findCategoryById(id: number) {
    return this.prisma.questionCategory.findUnique({
      where: { category_id: id },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  async updateCategory(id: number, data: any) {
    return this.prisma.questionCategory.update({
      where: { category_id: id },
      data,
    });
  }

  async deleteCategory(id: number) {
    return this.prisma.questionCategory.delete({
      where: { category_id: id },
    });
  }

  // ============================================================
  // QUESTIONS
  // ============================================================
  async createQuestion(data: {
    content: string;
    type: any;
    difficulty: any;
    category_id?: number;
    is_multiple_answer: boolean;
    options: any;
    created_by: number;
    is_public: boolean;
  }) {
    return this.prisma.question.create({
      data: {
        content: data.content,
        type: data.type as any,
        difficulty: data.difficulty as any,
        category_id: data.category_id,
        is_multiple_answer: data.is_multiple_answer,
        options: data.options as any,
        created_by: data.created_by,
        is_public: data.is_public,
      },
      include: {
        category: true,
      },
    });
  }

  async findManyQuestions(where: any, skip: number, take: number) {
    return this.prisma.question.findMany({
      where,
      skip,
      take,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        category: true,
      },
    });
  }

  async countQuestions(where: any) {
    return this.prisma.question.count({ where });
  }

  async findQuestionById(id: number) {
    return this.prisma.question.findUnique({
      where: { question_id: id },
      include: {
        category: true,
        question_exams: {
          include: {
            exam: {
              select: {
                exam_id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  async findQuestionByIdSimple(id: number) {
    return this.prisma.question.findUnique({
      where: { question_id: id },
    });
  }

  async updateQuestion(id: number, data: any, options?: any) {
    return this.prisma.question.update({
      where: { question_id: id },
      data: {
        ...data,
        options: options as any,
      },
      include: {
        category: true,
      },
    });
  }

  async findQuestionWithRelations(id: number) {
    return this.prisma.question.findUnique({
      where: { question_id: id },
      include: {
        question_exams: true,
        submission_answers: true,
      },
    });
  }

  async deleteQuestion(id: number) {
    return this.prisma.question.delete({
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
        category: true,
        question_exams: {
          include: {
            exam: true,
          },
        },
      },
    });
  }

  async findRandomQuestions(where: any, skip: number, take: number) {
    return this.prisma.question.findMany({
      where,
      skip,
      take,
      include: {
        category: true,
      },
      orderBy: {
        question_id: 'asc',
      },
    });
  }
}
