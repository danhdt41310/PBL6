import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto, GradeSubmissionDto } from './dto';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  async createSubmission(@Body() createSubmissionDto: CreateSubmissionDto) {
    return this.submissionsService.createSubmission(createSubmissionDto);
  }

  @Get('exam/:examId')
  async findSubmissionsByExam(@Param('examId') examId: number) {
    return this.submissionsService.findSubmissionsByExam(examId);
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

  @MessagePattern('grade_submission')
  async gradeSubmissionMessage(@Payload() data: { submissionId: number, score: number, feedback: string, gradedBy: number }) {
    return this.submissionsService.gradeSubmission(data.submissionId, {
      score: data.score,
      teacher_feedback: data.feedback,
      graded_by: data.gradedBy
    });
  }
}
