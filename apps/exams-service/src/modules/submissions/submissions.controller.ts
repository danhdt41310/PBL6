import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto, GradeSubmissionDto, StartExamDto, SubmitAnswerDto, UpdateRemainingTimeDto } from './dto';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  async createSubmission(@Body() createSubmissionDto: CreateSubmissionDto) {
    return this.submissionsService.createSubmission(createSubmissionDto);
  }

  @Get('exam/:examId')
  async findSubmissionsByExam(
    @Param('examId') examId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.submissionsService.findSubmissionsByExam(
      examId,
      page ? +page : 1,
      limit ? +limit : 10
    );
  }

  @Get(':id')
  async findSubmissionById(@Param('id') id: number) {
    return this.submissionsService.findSubmissionById(id);
  }

  @Get('student/:studentId')
  async findSubmissionsByStudent(
    @Param('studentId') studentId: number,
    @Query('examId') examId?: number
  ) {
    return this.submissionsService.findSubmissionsByStudent(studentId, examId);
  }

  @Put(':id/grade')
  async gradeSubmission(
    @Param('id') id: number,
    @Body() gradeData: GradeSubmissionDto
  ) {
    return this.submissionsService.gradeSubmission(id, gradeData);
  }

  // Microservice patterns
  @MessagePattern('get_student_submissions')
  async getStudentSubmissions(@Payload() data: { studentId: number, examId?: number }) {
    return this.submissionsService.findSubmissionsByStudent(data.studentId, data.examId);
  }

  @MessagePattern('get_submissions_by_exam')
  async getSubmissionsByExamMessage(@Payload() data: { examId: number, page?: number, limit?: number }) {
    return this.submissionsService.findSubmissionsByExam(
      data.examId,
      data.page || 1,
      data.limit || 10
    );
  }

  @MessagePattern('get_submission_by_id')
  async getSubmissionByIdMessage(@Payload() data: { id: number }) {
    return this.submissionsService.findSubmissionById(data.id);
  }

  @MessagePattern('grade_submission')
  async gradeSubmissionMessage(@Payload() data: { submissionId: number, score: number, teacher_feedback?: string, graded_by: number }) {
    return this.submissionsService.gradeSubmission(data.submissionId, {
      score: data.score,
      teacher_feedback: data.teacher_feedback,
      graded_by: data.graded_by
    });
  }

  // ============================================================
  // NEW EXAM TAKING ENDPOINTS
  // ============================================================

  /**
   * Start or get existing submission for an exam
   * Returns the first question (order = 1)
   */
  @MessagePattern('submissions.start_exam')
  async startExam(@Payload() data: { exam_id: number; student_id: number }) {
    return this.submissionsService.startExam(data.exam_id, data.student_id);
  }

  /**
   * Get a specific question by order for a submission
   * Returns question details and existing answer if available
   */
  @MessagePattern('submissions.get_question_by_order')
  async getQuestionByOrder(@Payload() data: { submission_id: number; order: number }) {
    return this.submissionsService.getQuestionByOrder(data.submission_id, data.order);
  }

  /**
   * Submit or update an answer for a question
   */
  @MessagePattern('submissions.submit_answer')
  async submitAnswer(@Payload() data: { submission_id: number; question_id: number; answer_content: string }) {
    return this.submissionsService.submitAnswer(data.submission_id, {
      question_id: data.question_id,
      answer_content: data.answer_content,
    });
  }

  /**
   * Resume exam - get current question based on current_question_order
   */
  @MessagePattern('submissions.resume_exam')
  async resumeExam(@Payload() data: { submission_id: number }) {
    return this.submissionsService.resumeExam(data.submission_id);
  }

  /**
   * Submit the entire exam - mark as submitted
   */
  @MessagePattern('submissions.submit_exam')
  async submitExam(@Payload() data: { submission_id: number }) {
    return this.submissionsService.submitExam(data.submission_id);
  }

  /**
   * Update remaining time for a submission
   */
  @MessagePattern('submissions.update_time')
  async updateRemainingTime(@Payload() data: { submission_id: number; remaining_time: number }) {
    return this.submissionsService.updateRemainingTime(data.submission_id, {
      remaining_time: data.remaining_time,
    });
  }
}
