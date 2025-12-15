import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubmissionDto, UpdateRemainingTimeDto } from './dto';

@Injectable()
export class SubmissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSubmissionDto: CreateSubmissionDto) {
    const { answers, ...submissionData } = createSubmissionDto;
    
    return this.prisma.submission.create({
      data: {
        ...submissionData,
        answers: {
          create: answers,
        },
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        exam: true,
      },
    });
  }

  async countByExamId(examId: number) {
    return this.prisma.submission.count({
      where: { exam_id: examId },
    });
  }

  async findManyByExamId(examId: number, skip: number, take: number) {
    return this.prisma.submission.findMany({
      where: { exam_id: examId },
      include: {
        _count: {
          select: { answers: true },
        },
      },
      skip,
      take,
      orderBy: {
        submitted_at: 'desc',
      },
    });
  }

  async findById(id: number) {
    return this.prisma.submission.findUnique({
      where: { submission_id: id },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        exam: true,
      },
    });
  }

  async findManyByStudent(studentId: number, examId?: number) {
    return this.prisma.submission.findMany({
      where: {
        student_id: studentId,
        ...(examId && { exam_id: examId }),
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        exam: true,
      },
    });
  }

  async update(submissionId: number, data: any) {
    return this.prisma.submission.update({
      where: { submission_id: submissionId },
      data,
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        exam: true,
      },
    });
  }

  async findByExamAndStudent(examId: number, studentId: number) {
    return this.prisma.submission.findUnique({
      where: {
        exam_id_student_id: {
          exam_id: examId,
          student_id: studentId,
        },
      },
      include: {
        answers: true,
      },
    });
  }

  async createSubmission(data: any) {
    return this.prisma.submission.create({
      data: data as any,
      include: {
        answers: true,
      },
    });
  }

  async findSubmissionWithExamAndQuestions(submissionId: number, order: number) {
    return this.prisma.submission.findUnique({
      where: { submission_id: submissionId },
      include: {
        exam: {
          include: {
            question_exams: {
              where: { order },
              include: {
                question: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });
  }

  async updateCurrentQuestionOrder(submissionId: number, order: number) {
    return this.prisma.submission.update({
      where: { submission_id: submissionId },
      data: {
        current_question_order: order,
      },
    });
  }

  async countQuestionsByExamId(examId: number) {
    return this.prisma.questionExam.count({
      where: { exam_id: examId },
    });
  }

  async findSubmissionWithExamAndAnswers(submissionId: number) {
    return this.prisma.submission.findUnique({
      where: { submission_id: submissionId },
      include: {
        exam: {
          include: {
            question_exams: {
              orderBy: { order: 'asc' },
              include: {
                question: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });
  }

  async updateSubmissionStatus(submissionId: number, status: any, submittedAt?: Date) {
    return this.prisma.submission.update({
      where: { submission_id: submissionId },
      data: {
        status: status as any,
        submitted_at: submittedAt,
      },
    });
  }

  async findSubmissionWithAnswersAndQuestions(submissionId: number) {
    return this.prisma.submission.findUnique({
      where: { submission_id: submissionId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });
  }

  async findQuestionExamsByExamId(examId: number) {
    return this.prisma.questionExam.findMany({
      where: { exam_id: examId },
      include: {
        question: true,
      },
    });
  }

  async updateSubmissionScore(submissionId: number, score: number) {
    return this.prisma.submission.update({
      where: { submission_id: submissionId },
      data: {
        score,
      },
    });
  }

  async findSubmissionAnswerBySubmissionAndQuestion(submissionId: number, questionId: number) {
    return this.prisma.submissionAnswer.findFirst({
      where: {
        submission_id: submissionId,
        question_id: questionId,
      },
    });
  }

  async createSubmissionAnswer(data: any) {
    return this.prisma.submissionAnswer.create({
      data,
    });
  }

  async updateSubmissionAnswer(answerId: number, data: any) {
    return this.prisma.submissionAnswer.update({
      where: { answer_id: answerId },
      data,
    });
  }

  async updateRemainingTime(submissionId: number, remainingTime: number) {
    return this.prisma.submission.update({
      where: { submission_id: submissionId },
      data: {
        remaining_time: remainingTime,
      },
    });
  }

  async updateAnswersBatch(answers: Array<{ answer_id: number; points_earned?: number; comment?: string }>) {
    return this.prisma.$transaction(
      answers.map(answer =>
        this.prisma.submissionAnswer.update({
          where: { answer_id: answer.answer_id },
          data: {
            points_earned: answer.points_earned,
            comment: answer.comment,
          },
        })
      )
    );
  }

  async updateSubmissionGrading(submissionId: number, status: any, gradedBy?: number, gradedAt?: Date) {
    return this.prisma.submission.update({
      where: { submission_id: submissionId },
      data: {
        status: status as any,
        graded_by: gradedBy,
        graded_at: gradedAt,
      },
    });
  }
}
