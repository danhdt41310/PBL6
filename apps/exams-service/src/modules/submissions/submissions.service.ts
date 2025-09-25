import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubmissionDto, GradeSubmissionDto } from './dto';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubmission(createSubmissionDto: CreateSubmissionDto) {
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

  async findSubmissionsByExam(examId: number) {
    return this.prisma.submission.findMany({
      where: { exam_id: examId },
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

  async findSubmissionById(id: number) {
    const submission = await this.prisma.submission.findUnique({
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

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    return submission;
  }

  async findSubmissionsByStudent(studentId: number, examId?: number) {
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

  async gradeSubmission(submissionId: number, gradeData: GradeSubmissionDto) {
    const submission = await this.findSubmissionById(submissionId);
    
    return this.prisma.submission.update({
      where: { submission_id: submissionId },
      data: {
        score: gradeData.score,
        teacher_feedback: gradeData.teacher_feedback,
        graded_by: gradeData.graded_by,
        graded_at: new Date(),
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
}
