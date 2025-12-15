import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExamStatus } from './dto/create-exam.dto';
import { Prisma } from '@prisma/exams-client';

@Injectable()
export class ExamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyQuestions(questionIds: number[]) {
    return this.prisma.question.findMany({
      where: { question_id: { in: questionIds } },
      select: { question_id: true }
    });
  }

  async createExamWithTransaction(
    examData: {
      class_id: number;
      title: string;
      start_time: Date;
      end_time: Date;
      total_time: number;
      description?: string;
      status: ExamStatus;
      created_by: number;
      password: string;
    },
    questions?: Array<{
      question_id: number;
      order: number;
      points: number;
    }>
  ) {
    return this.prisma.$transaction(async (prisma) => {
      // Create the exam
      const exam = await prisma.exam.create({
        data: {
          class_id: examData.class_id,
          title: examData.title,
          start_time: examData.start_time,
          end_time: examData.end_time,
          total_time: examData.total_time,
          description: examData.description,
          status: examData.status,
          created_by: examData.created_by,
          password: examData.password,
        },
      });

      // Create question_exam relationships if questions are provided
      if (questions && questions.length > 0) {
        await prisma.questionExam.createMany({
          data: questions.map(q => ({
            exam_id: exam.exam_id,
            question_id: q.question_id,
            order: q.order,
            points: q.points,
          })),
        });
      }

      // Return exam with questions
      return prisma.exam.findUnique({
        where: { exam_id: exam.exam_id },
        include: {
          question_exams: {
            include: {
              question: {
                include: {
                  category: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    });
  }

  async updateExamWithTransaction(
    examId: number,
    updateData: any,
    questions?: Array<{
      question_id: number;
      order: number;
      points: number;
    }>
  ) {
    return this.prisma.$transaction(async (prisma) => {
      // Update exam data
      const exam = await prisma.exam.update({
        where: { exam_id: examId },
        data: updateData,
      });

      // Update questions if provided
      if (questions !== undefined) {
        // Delete existing question associations
        await prisma.questionExam.deleteMany({
          where: { exam_id: examId },
        });

        // Create new associations
        if (questions.length > 0) {
          await prisma.questionExam.createMany({
            data: questions.map(q => ({
              exam_id: examId,
              question_id: q.question_id,
              order: q.order,
              points: q.points,
            })),
          });
        }
      }

      // Return updated exam with questions
      return prisma.exam.findUnique({
        where: { exam_id: examId },
        include: {
          question_exams: {
            include: {
              question: {
                include: {
                  category: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    });
  }

  async deleteExam(examId: number) {
    return this.prisma.exam.delete({
      where: { exam_id: examId },
    });
  }

  async countExams(where: any) {
    return this.prisma.exam.count({ where });
  }

  async findManyExams(where: any, skip: number, take: number) {
    return this.prisma.exam.findMany({
      where,
      skip,
      take,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        question_exams: {
          include: {
            question: {
              select: {
                question_id: true,
                content: true,
                type: true,
                difficulty: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });
  }

  async findManyExamsByClassIds(classIds: number[]) {
    const conditions: Prisma.ExamWhereInput[] = classIds.map((class_id) => ({
      class_id
    } as Prisma.ExamWhereInput));
    
    return this.prisma.exam.findMany({
      where: {
        OR: conditions
      },
    });
  }

  async findExamById(examId: number) {
    return this.prisma.exam.findUnique({
      where: { exam_id: examId },
      include: {
        submissions: true,
        question_exams: {
          include: {
            question: true,
          },
        },
      },
    });
  }

  async findManyExamsWithSubmissions(where: any, skip: number, take: number, studentId: number) {
    return this.prisma.exam.findMany({
      where,
      skip,
      take,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        question_exams: {
          include: {
            question: {
              select: {
                question_id: true,
                content: true,
                type: true,
                difficulty: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        submissions: {
          where: {
            student_id: studentId,
          },
          select: {
            submission_id: true,
            status: true,
            score: true,
            submitted_at: true,
            remaining_time: true,
            current_question_order: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });
  }

  async findExamByIdForPassword(examId: number) {
    return this.prisma.exam.findUnique({
      where: { exam_id: examId },
      select: {
        exam_id: true,
        password: true,
        title: true,
      },
    });
  }
}
