import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamDto, UpdateExamDto, ExamFilterDto, ExamStatus } from './dto/create-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new exam with questions
   * Uses transaction to ensure both exam and question_exam records are created atomically
   */
  async createExam(createExamDto: CreateExamDto) {
    try {
      const { questions, ...examData } = createExamDto;

      // Validate that questions exist
      if (questions && questions.length > 0) {
        const questionIds = questions.map(q => q.question_id);
        const existingQuestions = await this.prisma.question.findMany({
          where: { question_id: { in: questionIds } },
          select: { question_id: true }
        });

        if (existingQuestions.length !== questionIds.length) {
          const foundIds = existingQuestions.map(q => q.question_id);
          const missingIds = questionIds.filter(id => !foundIds.includes(id));
          throw new BadRequestException(`Questions not found: ${missingIds.join(', ')}`);
        }
      }

      // Use transaction to create exam and question associations
      const result = await this.prisma.$transaction(async (prisma) => {
        // Create the exam
        const exam = await prisma.exam.create({
          data: {
            class_id: examData.class_id,
            title: examData.title,
            start_time: new Date(examData.start_time),
            end_time: new Date(examData.end_time),
            total_time: examData.total_time,
            description: examData.description,
            status: examData.status || ExamStatus.DRAFT,
            created_by: examData.created_by,
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

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create exam: ' + error.message);
    }
  }

  /**
   * Update an existing exam
   * Can update exam details and question associations
   */
  async updateExam(id: number, updateExamDto: UpdateExamDto) {
    try {
      // Check if exam exists
      const existingExam = await this.findOne(id);

      const { questions, ...examData } = updateExamDto;

      // Validate questions if provided
      if (questions && questions.length > 0) {
        const questionIds = questions.map(q => q.question_id);
        const existingQuestions = await this.prisma.question.findMany({
          where: { question_id: { in: questionIds } },
          select: { question_id: true }
        });

        if (existingQuestions.length !== questionIds.length) {
          const foundIds = existingQuestions.map(q => q.question_id);
          const missingIds = questionIds.filter(id => !foundIds.includes(id));
          throw new BadRequestException(`Questions not found: ${missingIds.join(', ')}`);
        }
      }

      // Use transaction to update exam and questions
      const result = await this.prisma.$transaction(async (prisma) => {
        // Update exam data
        const updateData: any = {};
        if (examData.class_id !== undefined) updateData.class_id = examData.class_id;
        if (examData.title !== undefined) updateData.title = examData.title;
        if (examData.start_time !== undefined) updateData.start_time = new Date(examData.start_time);
        if (examData.end_time !== undefined) updateData.end_time = new Date(examData.end_time);
        if (examData.total_time !== undefined) updateData.total_time = examData.total_time;
        if (examData.description !== undefined) updateData.description = examData.description;
        if (examData.status !== undefined) updateData.status = examData.status;

        const exam = await prisma.exam.update({
          where: { exam_id: id },
          data: updateData,
        });

        // Update questions if provided
        if (questions !== undefined) {
          // Delete existing question associations
          await prisma.questionExam.deleteMany({
            where: { exam_id: id },
          });

          // Create new associations
          if (questions.length > 0) {
            await prisma.questionExam.createMany({
              data: questions.map(q => ({
                exam_id: id,
                question_id: q.question_id,
                order: q.order,
                points: q.points,
              })),
            });
          }
        }

        // Return updated exam with questions
        return prisma.exam.findUnique({
          where: { exam_id: id },
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

      return result;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update exam: ' + error.message);
    }
  }

  /**
   * Delete an exam
   * Cascade deletion will handle question_exam and submission relationships
   */
  async deleteExam(id: number) {
    try {
      // Check if exam exists
      await this.findOne(id);

      await this.prisma.exam.delete({
        where: { exam_id: id },
      });

      return { message: 'Exam deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete exam: ' + error.message);
    }
  }

  /**
   * Get paginated and filtered list of exams
   */
  async findAll(filterDto?: ExamFilterDto) {
    try {
      const { page = 1, limit = 10, search, class_id, status, created_by } = filterDto || {};
      
      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100); // Max 100 items per page

      // Build where clause
      const where: any = {};
      
      if (class_id) where.class_id = class_id;
      if (status) where.status = status;
      if (created_by) where.created_by = created_by;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await this.prisma.exam.count({ where });

      // Get paginated results
      const exams = await this.prisma.exam.findMany({
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

      return {
        data: exams,
        pagination: {
          total,
          page,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch exams: ' + error.message);
    }
  }

  async findOne(id: number) {
    const exam = await this.prisma.exam.findUnique({
      where: { exam_id: id },
      include: {
        submissions: true,
        question_exams: {
          include: {
            question: true,
          },
        },
      },
    });
    
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    
    return exam;
  }
}
