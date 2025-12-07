import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamDto, UpdateExamDto, ExamFilterDto, ExamStatus } from './dto/create-exam.dto';
import { Prisma } from '@prisma/exams-client';
import { firstValueFrom } from 'rxjs';
import { EmbeddingService } from 'src/embedding/embedding.service';
import { ExamsRepository } from './exams.repository';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly examsRepository: ExamsRepository,
    private readonly embed: EmbeddingService,
    @Inject('CLASSES_SERVICE') private readonly classesService: ClientProxy,
  ) {}

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
        const existingQuestions = await this.examsRepository.findManyQuestions(questionIds);

        if (existingQuestions.length !== questionIds.length) {
          const foundIds = existingQuestions.map(q => q.question_id);
          const missingIds = questionIds.filter(id => !foundIds.includes(id));
          throw new BadRequestException(`Questions not found: ${missingIds.join(', ')}`);
        }
      }

      // Use transaction to create exam and question associations
      const result = await this.examsRepository.createExamWithTransaction(
        {
          class_id: examData.class_id,
          title: examData.title,
          start_time: new Date(examData.start_time),
          end_time: new Date(examData.end_time),
          total_time: examData.total_time,
          description: examData.description,
          status: examData.status || ExamStatus.DRAFT,
          created_by: examData.created_by,
          password: examData.password || "",
        },
        questions
      );

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
        const existingQuestions = await this.examsRepository.findManyQuestions(questionIds);

        if (existingQuestions.length !== questionIds.length) {
          const foundIds = existingQuestions.map(q => q.question_id);
          const missingIds = questionIds.filter(id => !foundIds.includes(id));
          throw new BadRequestException(`Questions not found: ${missingIds.join(', ')}`);
        }
      }

      // Use transaction to update exam and questions
      const updateData: any = {};
      if (examData.class_id !== undefined) updateData.class_id = examData.class_id;
      if (examData.title !== undefined) updateData.title = examData.title;
      if (examData.start_time !== undefined) updateData.start_time = new Date(examData.start_time);
      if (examData.end_time !== undefined) updateData.end_time = new Date(examData.end_time);
      if (examData.total_time !== undefined) updateData.total_time = examData.total_time;
      if (examData.description !== undefined) updateData.description = examData.description;
      if (examData.status !== undefined) updateData.status = examData.status;
      if (examData.password !== undefined) updateData.password = examData.password;

      const result = await this.examsRepository.updateExamWithTransaction(id, updateData, questions);

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

      await this.examsRepository.deleteExam(id);

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
      const { 
        page = 1, 
        limit = 10, 
        search, 
        status,
        start_time,
        end_time,
        created_by
      } = filterDto || {};
      
      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100); // Max 100 items per page

      // Build where clause
      const where: any = {};

      // Filter by status
      if (status) {
        where.status = status;
      }

      // Search in title or description
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Filter by time range: exam's start_time >= start_time AND exam's end_time <= end_time
      if (start_time) {
        where.start_time = { gte: new Date(start_time) };
      }

      if (end_time) {
        where.end_time = { lte: new Date(end_time) };
      }

      if (created_by) {
        where.created_by = created_by;
      }

      // Get total count
      const total = await this.examsRepository.countExams(where);

      // Get paginated results
      const exams = await this.examsRepository.findManyExams(where, skip, take);

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

  async findAllOf(class_ids: number[]){
    try{
      const exams = await this.examsRepository.findManyExamsByClassIds(class_ids);
      return {
        success:true,
        data: exams,
      };
    }
    catch (error){
      throw new BadRequestException('Failed to fetch exams: ' + error.message);
    }
  }

  async findOne(id: number) {
    const exam = await this.examsRepository.findExamById(id);
    
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    
    return exam;
  }

  /**
   * Get exams that a student can access based on their enrolled classes
   */
  async findExamsByStudentId(studentId: number, filterDto?: ExamFilterDto) {
    try {
      // Get all classes that the student is enrolled in from classes-service
      const enrollments = await firstValueFrom(
        this.classesService.send('classes.enrollments.findByStudent', { student_id: studentId })
      );

      if (!enrollments || enrollments.length === 0) {
        return {
          data: [],
          pagination: {
            total: 0,
            page: filterDto?.page || 1,
            limit: filterDto?.limit || 10,
            totalPages: 0,
          },
        };
      }

      // Extract class IDs from enrollments
      const classIds = enrollments.map((enrollment: any) => enrollment.class_id);

      const { 
        page = 1, 
        limit = 10, 
        search, 
        status,
        start_time,
        end_time
      } = filterDto || {};
      
      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100);

      // Build where clause
      const where: any = {
        class_id: { in: classIds }, // Only exams from enrolled classes
      };
      
      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (start_time) {
        where.start_time = { gte: new Date(start_time) };
      }

      if (end_time) {
        where.end_time = { lte: new Date(end_time) };
      }

      // Get total count
      const total = await this.examsRepository.countExams(where);

      // Get paginated results
      const exams = await this.examsRepository.findManyExamsWithSubmissions(where, skip, take, studentId);

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
      throw new BadRequestException('Failed to fetch student exams: ' + error.message);
    }
  }

  async answerCorrectness(student_answer: string, correct_answer: string){
    const score = await this.embed.similarCosineSimilarScore(student_answer, correct_answer)
    return score
  }

  /**
   * Verify if the provided password is correct for an exam
   */
  async verifyExamPassword(exam_id: number, student_id: number, password: string) {
    try {
      // Find the exam
      const exam = await this.examsRepository.findExamByIdForPassword(exam_id);

      if (!exam) {
        throw new NotFoundException(`Exam with ID ${exam_id} not found`);
      }

      // Check if exam has a password
      const hasPassword = exam.password && exam.password.trim() !== '';
      
      if (!hasPassword) {
        // Exam doesn't require password
        return {
          success: true,
          message: 'Exam does not require a password',
          has_password: false,
        };
      }

      // Verify the password
      const isCorrect = exam.password === password;

      return {
        success: isCorrect,
        message: isCorrect ? 'Password is correct' : 'Incorrect password',
        has_password: true,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to verify exam password: ' + error.message);
    }
  }
}
