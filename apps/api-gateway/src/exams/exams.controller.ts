import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  ParseIntPipe,
  Req,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
  Res,
  StreamableFile,
} from '@nestjs/common'
import { Response } from 'express'
import { ClientProxy } from '@nestjs/microservices'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger'
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionFilterDto,
  CreateQuestionCategoryDto,
  UpdateQuestionCategoryDto,
  CreateExamDto,
  UpdateExamDto,
  ExamFilterDto,
  ClassIdListDto,
  GetRandomQuestionsDto,
  SubmitAnswerDto,
  UpdateRemainingTimeDto,
  AnswerCorrectnessDto,
} from '../dto/exam.dto'
import { SkipPermissionCheck } from '../common/decorators/skip-permission-check.decorator'
import { FileValidationInterceptor } from '../common/interceptors/file-validation.interceptor'
import { DefaultFileUploadConfigs } from '../common/types/file.types'
import { firstValueFrom } from 'rxjs'

interface RequestWithUser extends Request {
  user?: {
    userId: number
    email: string
    role: string
  }
}

@ApiTags('Questions & Categories')
@ApiBearerAuth('JWT-auth')
@Controller()
export class ExamsController {
  constructor(@Inject('EXAMS_SERVICE') private examsService: ClientProxy) { }

  // ============================================================
  // EXAMS
  // ============================================================
  @Post('exams')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Create a new exam',
    description: 'Create a new exam with questions. Creator ID will be set from JWT token.'
  })
  @ApiBody({ type: CreateExamDto })
  @ApiResponse({ status: 201, description: 'Exam created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or questions not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires teacher role' })
  async createExam(
    @Body(ValidationPipe) createExamDto: CreateExamDto,
    @Req() req: RequestWithUser
  ) {
    const examData = {
      ...createExamDto,
      created_by: req.user?.userId || createExamDto.created_by,
    }

    return firstValueFrom(
      this.examsService.send('exams.create', examData)
    )
  }

  @Get('exams')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Get all exams',
    description: 'Get paginated list of exams with filters. Returns exams that have start_time and end_time within the specified range.'
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in exam title or description' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'published', 'in_progress', 'completed', 'cancelled'], description: 'Filter by exam status' })
  @ApiQuery({ name: 'start_time', required: false, type: String, description: 'Filter exams with start_time >= this value (ISO 8601)' })
  @ApiQuery({ name: 'end_time', required: false, type: String, description: 'Filter exams with end_time <= this value (ISO 8601)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({ status: 200, description: 'Exams retrieved successfully' })
  async getAllExams(@Query(ValidationPipe) filterDto: ExamFilterDto, @Req() req: RequestWithUser) {
    filterDto.created_by = req.user?.userId;
    return firstValueFrom(
      this.examsService.send('exams.findAll', filterDto)
    )
  }

  @Get('students/exams')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Get exams for current student',
    description: 'Get paginated list of exams that the current student can access based on their enrolled classes. Includes submission status if student has started the exam.'
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in exam title or description' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'published', 'in_progress', 'completed', 'cancelled'], description: 'Filter by exam status' })
  @ApiQuery({ name: 'start_time', required: false, type: String, description: 'Filter exams with start_time >= this value (ISO 8601)' })
  @ApiQuery({ name: 'end_time', required: false, type: String, description: 'Filter exams with end_time <= this value (ISO 8601)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Student exams retrieved successfully',
    schema: {
      example: {
        data: [
          {
            exam_id: 1,
            class_id: 1,
            title: 'Midterm Exam',
            start_time: '2024-01-15T09:00:00.000Z',
            end_time: '2024-01-15T11:00:00.000Z',
            total_time: 120,
            description: 'Midterm examination',
            status: 'published',
            created_by: 1,
            created_at: '2024-01-01T00:00:00.000Z',
            question_exams: [],
            submissions: [
              {
                submission_id: 1,
                status: 'in_progress',
                score: null,
                submitted_at: '2024-01-15T09:05:00.000Z',
                remaining_time: 6900,
                current_question_order: 3
              }
            ],
            _count: {
              submissions: 5
            }
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid parameters' })
  async getStudentExams(
    @Query(ValidationPipe) filterDto: ExamFilterDto,
    @Req() req: RequestWithUser
  ) {
    const studentId = req.user?.userId;
    if (!studentId) {
      throw new BadRequestException('Student ID not found in token');
    }

    return firstValueFrom(
      this.examsService.send('exams.findByStudentId', { studentId, filterDto })
    );
  }

  @Get('exams/:id')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Get exam by ID',
    description: 'Get detailed information about a specific exam including all questions and submissions'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Exam retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async getExamById(@Param('id', ParseIntPipe) id: number) {
    return firstValueFrom(
      this.examsService.send('exams.findOne', { id })
    )
  }

  @Put('exams/:id')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Update exam',
    description: 'Update an existing exam. Can update exam details and/or replace questions.'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Exam ID' })
  @ApiBody({ type: UpdateExamDto })
  @ApiResponse({ status: 200, description: 'Exam updated successfully' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only update own exams' })
  async updateExam(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateExamDto: UpdateExamDto,
  ) {
    return firstValueFrom(
      this.examsService.send('exams.update', { id, updateExamDto })
    )
  }

  @Delete('exams/:id')
  @ApiOperation({
    summary: 'Delete exam',
    description: 'Delete an exam and all associated data (question associations, submissions, etc.)'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Exam deleted successfully' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only delete own exams' })
  async deleteExam(@Param('id', ParseIntPipe) id: number) {
    return firstValueFrom(
      this.examsService.send('exams.delete', { id })
    )
  }

  // ============================================================
  // QUESTION CATEGORY
  // ============================================================
  @Post('question-categories')
  @ApiOperation({
    summary: 'Create question category',
    description: 'Create a new question category (teachers only)'
  })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires teacher role' })
  async createCategory(
    @Body(ValidationPipe) createCategoryDto: CreateQuestionCategoryDto,
    @Req() req: RequestWithUser
  ) {
    return firstValueFrom(
      this.examsService.send('questions.categories.create', createCategoryDto)
    )
  }

  @Get('question-categories')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Get all question categories',
    description: 'Get list of question categories created by the current user with question count. Supports search by name.'
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by category name (case-insensitive)' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      example: [
        {
          category_id: 1,
          name: 'Mathematics',
          description: 'Math questions',
          created_by: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          question_count: 15
        }
      ]
    }
  })
  async getAllCategories(
    @Query('search') search?: string,
    @Req() req?: RequestWithUser
  ) {
    // If user not authenticated, return empty array
    if (!req?.user?.userId) {
      return []
    }

    const result = await firstValueFrom(
      this.examsService.send('questions.categories.findAll', {
        search,
        created_by: req.user.userId
      })
    )
    return result
  }

  @Get('question-categories/:id')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Get detailed information about a category (only if owned by current user)'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found or access denied' })
  async getCategoryById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    return firstValueFrom(
      this.examsService.send('questions.categories.findOne', {
        id,
        userId: req.user?.userId
      })
    )
  }

  @Put('question-categories/:id')
  @ApiOperation({
    summary: 'Update category',
    description: 'Update an existing question category (only creator can update)'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found or access denied' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateCategoryDto: UpdateQuestionCategoryDto,
    @Req() req: RequestWithUser
  ) {
    return firstValueFrom(
      this.examsService.send('questions.categories.update', {
        id,
        updateCategoryDto,
        userId: req.user?.userId
      })
    )
  }

  @Delete('question-categories/:id')
  @ApiOperation({
    summary: 'Delete category',
    description: 'Delete a category (only if no questions use it and only creator can delete)'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found or access denied' })
  @ApiResponse({ status: 400, description: 'Category has questions' })
  async deleteCategory(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser
  ) {
    return firstValueFrom(
      this.examsService.send('questions.categories.delete', {
        id,
        userId: req.user?.userId
      })
    )
  }

  // ============================================================
  // QUESTIONS
  // ============================================================
  @Post('questions')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Create a new question',
    description: 'Create a new question (teachers only). Creator ID will be set from JWT token.'
  })
  @ApiBody({ type: CreateQuestionDto })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires teacher role' })
  async createQuestion(
    @Body(ValidationPipe) createQuestionDto: CreateQuestionDto,
    @Req() req: RequestWithUser
  ) {
    return firstValueFrom(
      this.examsService.send('questions.create', createQuestionDto)
    )
  }

  @Get('questions')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Get all questions',
    description: 'Get paginated list of questions with filters. Teachers see their own questions + public ones.'
  })
  @ApiQuery({ name: 'type', required: false, enum: ['multiple_choice', 'essay'], description: 'Question type filter' })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard'], description: 'Difficulty level filter' })
  @ApiQuery({ name: 'category_id', required: false, type: Number, description: 'Single category ID filter' })
  @ApiQuery({ name: 'category_ids', required: false, type: [Number], description: 'Multiple category IDs filter (comma-separated or repeated query params)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in question content' })
  @ApiQuery({ name: 'is_public', required: false, type: Boolean, description: 'Filter by public/private' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  async getAllQuestions(
    @Query(ValidationPipe) filterDto: QuestionFilterDto,
    @Req() req: RequestWithUser
  ) {
    // If user not authenticated, return empty result
    if (!req.user?.userId) {
      console.log('[getAllQuestions] No userId, returning empty result')
      return {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      }
    }

    const queryFilter = {
      ...filterDto,
      created_by: req.user.userId,
    }

    console.log('[getAllQuestions] Sending to exams-service:', JSON.stringify(queryFilter, null, 2))

    const result = await firstValueFrom(
      this.examsService.send('questions.findAll', queryFilter)
    )
    return result
  }

  @Get('questions/:id')
  @ApiOperation({
    summary: 'Get question by ID',
    description: 'Get detailed information about a specific question including its usage in exams'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async getQuestionById(@Param('id', ParseIntPipe) id: number) {
    return firstValueFrom(
      this.examsService.send('questions.findOne', { id })
    )
  }

  @Put('questions/:id')
  @ApiOperation({
    summary: 'Update question',
    description: 'Update an existing question. Only the creator can update their questions.'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Question ID' })
  @ApiBody({ type: UpdateQuestionDto })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only update own questions' })
  async updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateQuestionDto: UpdateQuestionDto,
  ) {
    return firstValueFrom(
      this.examsService.send('questions.update', { id, updateQuestionDto })
    )
  }

  @Delete('questions/:id')
  @ApiOperation({
    summary: 'Delete question',
    description: 'Delete a question. Can only delete if question is not used in any exam.'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  @ApiResponse({ status: 400, description: 'Question is being used in exams' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only delete own questions' })
  async deleteQuestion(@Param('id', ParseIntPipe) id: number) {
    return firstValueFrom(
      this.examsService.send('questions.delete', { id })
    )
  }

  // ============================================================
  // RANDOM QUESTIONS
  // ============================================================
  @Post('questions/random')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Get random questions',
    description: 'Get random questions based on multiple criteria (category, type, quantity). Supports multiple_choice, true_false, and essay types. true_false questions are multiple_choice with is_multiple_answer=false.'
  })
  @ApiBody({ type: GetRandomQuestionsDto })
  @ApiResponse({
    status: 200,
    description: 'Random questions retrieved successfully',
    schema: {
      example: {
        data: [
          {
            question_id: 1,
            content: 'What is OOP?',
            type: 'multiple_choice',
            difficulty: 'easy',
            category_id: 1,
            is_multiple_answer: false,
            options: [
              { id: 'opt_1', content: 'Object Oriented Programming', is_correct: true },
              { id: 'opt_2', content: 'Online Operating Platform', is_correct: false }
            ],
            created_by: 1,
            is_public: true,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
          }
        ],
        total: 50,
        summary: {
          requested: 15,
          fetched: 15,
          by_criteria: [
            { category_id: 1, type: 'multiple_choice', requested: 10, fetched: 10 },
            { type: 'true_false', requested: 5, fetched: 5 }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async getRandomQuestions(
    @Body(ValidationPipe) getRandomQuestionsDto: GetRandomQuestionsDto,
    @Req() req: RequestWithUser
  ) {
    return firstValueFrom(
      this.examsService.send('questions.random', {
        criteria: getRandomQuestionsDto.criteria,
        userId: req.user?.userId,
      })
    )
  }

  // ============================================================
  // EXAM SUBMISSION / TAKING ENDPOINTS
  // ============================================================

  @Post('exams/:exam_id/verify-password')
  @SkipPermissionCheck()
  @ApiOperation({ 
    summary: 'Verify exam password',
    description: 'Verify if the provided password is correct for an exam that requires password authentication.'
  })
  @ApiParam({ name: 'exam_id', type: 'number', description: 'Exam ID' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        password: { type: 'string', description: 'Password to verify' }
      },
      required: ['password']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password verification result',
    schema: {
      example: {
        success: true,
        message: 'Password is correct',
        has_password: true
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async verifyExamPassword(
    @Param('exam_id', ParseIntPipe) exam_id: number,
    @Body() body: { password: string },
    @Req() req: RequestWithUser
  ) {
    const studentId = req.user?.userId;
    if (!studentId) {
      throw new BadRequestException('User ID not found in token');
    }

    return firstValueFrom(
      this.examsService.send('exams.verify_password', {
        exam_id,
        student_id: studentId,
        password: body.password,
      })
    );
  }

  @Post('exams/:exam_id/start')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Start an exam',
    description: 'Create or get existing submission for a student. Returns the first question (order = 1) and remaining time. Student ID is taken from JWT token. If exam requires password, include it in request body.'
  })
  @ApiParam({ name: 'exam_id', type: 'number', description: 'Exam ID' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        password: { type: 'string', description: 'Exam password (if required)' }
      }
    },
    required: false
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Exam started successfully or existing submission returned',
    schema: {
      example: {
        submission_id: 1,
        exam_id: 1,
        exam_title: 'Midterm Exam',
        student_id: 1,
        current_question_order: 1,
        remaining_time: 3600,
        total_questions: 20,
        question: {
          question_id: 1,
          order: 1,
          points: 1.00,
          content: 'What is OOP?',
          type: 'multiple_choice',
          difficulty: 'easy',
          is_multiple_answer: false,
          options: [
            { id: 'opt_1', content: 'Object Oriented Programming', is_correct: true }
          ],
          category: { category_id: 1, name: 'Programming' }
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - incorrect password' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 400, description: 'Bad request - exam has no questions or already submitted' })
  async startExam(
    @Param('exam_id', ParseIntPipe) exam_id: number,
    @Body() body: { password?: string },
    @Req() req: RequestWithUser
  ) {
    const studentId = req.user?.userId;
    if (!studentId) {
      throw new BadRequestException('User ID not found in token');
    }

    return firstValueFrom(
      this.examsService.send('submissions.start_exam', {
        exam_id,
        student_id: studentId,
        password: body?.password,
      })
    );
  }

  @Get('submissions/:submission_id/questions/:order')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Get question by order',
    description: 'Get a specific question by order number for a submission. Returns question details and existing answer if available.'
  })
  @ApiParam({ name: 'submission_id', type: 'number', description: 'Submission ID' })
  @ApiParam({ name: 'order', type: 'number', description: 'Question order number (starts from 1)' })
  @ApiResponse({
    status: 200,
    description: 'Question retrieved successfully',
    schema: {
      example: {
        submission_id: 1,
        current_question_order: 2,
        remaining_time: 3500,
        total_questions: 20,
        question: {
          question_id: 2,
          order: 2,
          points: 2.00,
          content: 'Explain inheritance',
          type: 'essay',
          difficulty: 'medium',
          is_multiple_answer: false,
          options: null,
          category: { category_id: 1, name: 'Programming' }
        },
        existing_answer: {
          answer_id: 5,
          answer_content: 'Inheritance is...'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Submission or question not found' })
  async getQuestionByOrder(
    @Param('submission_id', ParseIntPipe) submission_id: number,
    @Param('order', ParseIntPipe) order: number
  ) {
    return firstValueFrom(
      this.examsService.send('submissions.get_question_by_order', {
        submission_id,
        order,
      })
    );
  }

  @Post('submissions/:submission_id/answers')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Submit or update an answer',
    description: 'Create or update a SubmissionAnswer record. If an answer already exists for the question, it will be updated.'
  })
  @ApiParam({ name: 'submission_id', type: 'number', description: 'Submission ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        question_id: { type: 'number', description: 'Question ID' },
        answer_content: { type: 'string', description: 'Answer content (JSON string for multiple choice, text for essay)' }
      },
      required: ['question_id', 'answer_content']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Answer submitted or updated successfully',
    schema: {
      example: {
        answer_id: 5,
        question_id: 2,
        answer_content: 'My answer...',
        message: 'Answer submitted successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  @ApiResponse({ status: 400, description: 'Bad request - submission not in progress or question not in exam' })
  async submitAnswer(
    @Param('submission_id', ParseIntPipe) submission_id: number,
    @Body(ValidationPipe) submitAnswerDto: SubmitAnswerDto
  ) {
    return firstValueFrom(
      this.examsService.send('submissions.submit_answer', {
        submission_id,
        question_id: submitAnswerDto.question_id,
        answer_content: submitAnswerDto.answer_content,
      })
    );
  }

  @Get('submissions/:submission_id/resume')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Resume exam',
    description: 'Resume an exam at the current question (based on current_question_order). Returns current question and remaining time.'
  })
  @ApiParam({ name: 'submission_id', type: 'number', description: 'Submission ID' })
  @ApiResponse({
    status: 200,
    description: 'Current question retrieved successfully',
    schema: {
      example: {
        submission_id: 1,
        exam_id: 1,
        exam_title: 'Midterm Exam',
        student_id: 1,
        current_question_order: 5,
        remaining_time: 3200,
        total_questions: 20,
        answered_count: 4,
        question: {
          question_id: 5,
          order: 5,
          points: 1.50,
          content: 'What is polymorphism?',
          type: 'multiple_choice',
          difficulty: 'medium',
          is_multiple_answer: false,
          options: [],
          category: { category_id: 1, name: 'Programming' }
        },
        existing_answer: null
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Submission or question not found' })
  @ApiResponse({ status: 400, description: 'Exam already submitted' })
  async resumeExam(
    @Param('submission_id', ParseIntPipe) submission_id: number
  ) {
    return firstValueFrom(
      this.examsService.send('submissions.resume_exam', {
        submission_id,
      })
    );
  }

  @Post('submissions/:submission_id/submit')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Submit exam',
    description: 'Mark submission as "submitted". After this, no more answers can be added/updated.'
  })
  @ApiParam({ name: 'submission_id', type: 'number', description: 'Submission ID' })
  @ApiResponse({
    status: 200,
    description: 'Exam submitted successfully',
    schema: {
      example: {
        submission_id: 1,
        exam_id: 1,
        student_id: 1,
        status: 'submitted',
        submitted_at: '2024-01-15T10:30:00.000Z',
        total_questions: 20,
        answered_questions: 18,
        message: 'Exam submitted successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  @ApiResponse({ status: 400, description: 'Exam already submitted' })
  async submitExam(
    @Param('submission_id', ParseIntPipe) submission_id: number
  ) {
    return firstValueFrom(
      this.examsService.send('submissions.submit_exam', {
        submission_id,
      })
    );
  }

  @Patch('submissions/:submission_id/time')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Update remaining time',
    description: 'Update the remaining time for a submission. Used to sync time as student takes the exam.'
  })
  @ApiParam({ name: 'submission_id', type: 'number', description: 'Submission ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        remaining_time: { type: 'number', description: 'Remaining time in seconds' }
      },
      required: ['remaining_time']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Remaining time updated successfully',
    schema: {
      example: {
        submission_id: 1,
        remaining_time: 3000,
        message: 'Remaining time updated successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  @ApiResponse({ status: 400, description: 'Submission not in progress' })
  async updateRemainingTime(
    @Param('submission_id', ParseIntPipe) submission_id: number,
    @Body(ValidationPipe) updateTimeDto: UpdateRemainingTimeDto
  ) {
    return firstValueFrom(
      this.examsService.send('submissions.update_time', {
        submission_id,
        remaining_time: updateTimeDto.remaining_time,
      })
    );
  }

  // ============================================================
  // SUBMISSIONS MANAGEMENT
  // ============================================================

  @Get('submissions/exam/:examId')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Get submissions by exam ID',
    description: 'Get paginated list of submissions for a specific exam. Returns submission details with answers and exam info.'
  })
  @ApiParam({ name: 'examId', type: 'number', description: 'Exam ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Submissions retrieved successfully',
    schema: {
      example: {
        data: [
          {
            submission_id: 1,
            exam_id: 1,
            student_id: 1,
            current_question_order: 5,
            remaining_time: 3000,
            submitted_at: '2024-01-15T10:30:00.000Z',
            score: 85.5,
            teacher_feedback: 'Good work!',
            graded_at: '2024-01-15T11:00:00.000Z',
            graded_by: 2,
            status: 'graded',
            answers: [
              {
                answer_id: 1,
                submission_id: 1,
                question_id: 1,
                answer_content: 'My answer',
                is_correct: true,
                points_earned: 10,
                comment: 'Correct!',
                comment_by: 2,
                question: {
                  question_id: 1,
                  content: 'What is OOP?',
                  type: 'multiple_choice'
                }
              }
            ],
            exam: {
              exam_id: 1,
              title: 'Midterm Exam',
              class_id: 1
            }
          }
        ],
        pagination: {
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async getSubmissionsByExam(
    @Param('examId', ParseIntPipe) examId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return firstValueFrom(
      this.examsService.send('get_submissions_by_exam', {
        examId,
        page: page ? +page : 1,
        limit: limit ? +limit : 10,
      })
    );
  }

  @Get('submissions/:id')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Get submission by ID',
    description: 'Get detailed information about a specific submission including all answers and questions.'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Submission ID' })
  @ApiResponse({
    status: 200,
    description: 'Submission retrieved successfully',
    schema: {
      example: {
        submission_id: 1,
        exam_id: 1,
        student_id: 1,
        current_question_order: 20,
        remaining_time: 0,
        submitted_at: '2024-01-15T10:30:00.000Z',
        score: 85.5,
        teacher_feedback: 'Excellent work!',
        graded_at: '2024-01-15T11:00:00.000Z',
        graded_by: 2,
        status: 'graded',
        answers: [
          {
            answer_id: 1,
            submission_id: 1,
            question_id: 1,
            answer_content: 'Object Oriented Programming',
            is_correct: true,
            points_earned: 5,
            comment: 'Perfect!',
            comment_by: 2,
            question: {
              question_id: 1,
              content: 'What is OOP?',
              type: 'multiple_choice',
              options: [
                { id: 'opt_1', content: 'Object Oriented Programming', is_correct: true },
                { id: 'opt_2', content: 'Online Operating Platform', is_correct: false }
              ],
              difficulty: 'easy',
              category: {
                category_id: 1,
                name: 'Programming'
              }
            }
          }
        ],
        exam: {
          exam_id: 1,
          title: 'Midterm Exam',
          class_id: 1,
          start_time: '2024-01-15T09:00:00.000Z',
          end_time: '2024-01-15T11:00:00.000Z',
          total_time: 120,
          description: 'Midterm examination',
          status: 'completed'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async getSubmissionById(@Param('id', ParseIntPipe) id: number) {
    return firstValueFrom(
      this.examsService.send('get_submission_by_id', { id })
    );
  }

  @Put('submissions/:id/grade')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Grade a submission',
    description: 'Update the score and feedback for a submission. Only teachers can grade submissions.'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Submission ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number', description: 'Final score' },
        teacher_feedback: { type: 'string', description: 'Feedback from teacher' },
        graded_by: { type: 'number', description: 'Teacher ID who graded the submission' }
      },
      required: ['score', 'graded_by']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Submission graded successfully'
  })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires teacher role' })
  async gradeSubmission(
    @Param('id', ParseIntPipe) id: number,
    @Body() gradeData: { score: number; teacher_feedback?: string; graded_by: number }
  ) {
    return firstValueFrom(
      this.examsService.send('grade_submission', {
        submissionId: id,
        ...gradeData,
      })
    );
  }

  @Put('submissions/:id/answers')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Update submission answers',
    description: 'Update points and comments for individual answers in a submission. This will also recalculate the total score.'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Submission ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              answer_id: { type: 'number', description: 'Answer ID' },
              points_earned: { type: 'number', description: 'Points earned for this answer' },
              comment: { type: 'string', description: 'Comment for this answer' }
            },
            required: ['answer_id']
          }
        }
      },
      required: ['answers']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Answers updated successfully'
  })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async updateSubmissionAnswers(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { answers: Array<{ answer_id: number; points_earned?: number; comment?: string }> }
  ) {
    return firstValueFrom(
      this.examsService.send('submissions.update_answers', {
        submissionId: id,
        answers: data.answers,
      })
    );
  }

  @Put('submissions/:id/confirm-grading')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Confirm grading',
    description: 'Mark submission as graded without modifying answers. Calculates total score from existing answers.'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Submission ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        graded_by: { type: 'number', description: 'Teacher ID who confirmed the grading' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Grading confirmed successfully'
  })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async confirmGrading(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { graded_by?: number },
    @Req() req: RequestWithUser
  ) {
    return firstValueFrom(
      this.examsService.send('submissions.confirm_grading', {
        submissionId: id,
        graded_by: data.graded_by || req.user?.userId,
      })
    );
  }

  // *********************************************************
  //
  // Auto check answer
  // 
  // *********************************************************
  @Post('exams/answer-correctness')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        student_answer: { type: 'string', description: 'student answer for check' },
        correct_answer: { type: 'string', description: 'correct answer for compare' },
      },
      required: ['remaining_time']
    }
  })
  @SkipPermissionCheck()
  async answerCorrectness(@Body() answerCorrectnessDto: AnswerCorrectnessDto) {
    return firstValueFrom(
      this.examsService.send('exams.answer_correctness', answerCorrectnessDto)
    );
  }



  // ============================================================
  // IMPORT/EXPORT QUESTIONS
  // ============================================================
  @Post('questions/import/preview')
  @SkipPermissionCheck()
  @UseInterceptors(
    FileInterceptor('file'),
    new FileValidationInterceptor(DefaultFileUploadConfigs.EXCEL)
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Preview Excel import',
    description: 'Upload Excel file and preview questions before importing'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        limit: {
          type: 'number',
          description: 'Number of rows to preview (default: 10)'
        }
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Preview generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  async previewImport(
    @UploadedFile() file: Express.Multer.File,
    @Query('limit') limit?: string
  ) {
    console.log('=== PREVIEW IMPORT START ===');
    console.log('File received:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferSize: file.buffer?.length
    } : 'NO FILE');
    console.log('Limit parameter:', limit);

    if (!file) {
      console.log('ERROR: No file uploaded');
      throw new BadRequestException('No file uploaded')
    }

    console.log('Converting buffer to base64...');
    const base64Buffer = file.buffer.toString('base64');
    console.log('Base64 string created, length:', base64Buffer.length);

    console.log('Sending to exams service...');
    const result = await firstValueFrom(
      this.examsService.send('questions.import.preview', {
        buffer: base64Buffer,
        limit: limit ? parseInt(limit) : 10,
      })
    );
    console.log('Result received from service');
    console.log('=== PREVIEW IMPORT END ===');
    return result;
  }

  @Post('questions/import')
  @UseInterceptors(
    FileInterceptor('file'),
    new FileValidationInterceptor(DefaultFileUploadConfigs.EXCEL)
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Import questions from Excel',
    description: 'Upload Excel file to bulk import questions. Categories will be auto-created if not exist. Requires authentication.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Questions imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or data validation errors' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  async importQuestions(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded')
    }

    if (!req.user?.userId) {
      throw new UnauthorizedException('User not authenticated')
    }

    return firstValueFrom(
      this.examsService.send('questions.import.execute', {
        buffer: file.buffer.toString('base64'),
        createdBy: req.user.userId,
      })
    )
  }

  @Get('questions/import/template')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Download Excel template',
    description: 'Download the Excel template for bulk importing questions'
  })
  @ApiResponse({
    status: 200,
    description: 'Template downloaded',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  async downloadTemplate(@Res() res: Response) {
    const fs = require('fs')
    const path = require('path')

    const templatePath = path.join(__dirname, '..', '..', '..', '..', '..', 'templates', 'excels', 'TemplateImportQuestions.xlsx')

    if (!fs.existsSync(templatePath)) {
      throw new BadRequestException('Template file not found')
    }

    const file = fs.createReadStream(templatePath)
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="TemplateImportQuestions.xlsx"',
    })

    file.pipe(res)
  }

  @Get('questions/export/excel')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Export questions to Excel',
    description: 'Export filtered questions to Excel file'
  })
  @ApiQuery({ name: 'type', required: false, enum: ['multiple_choice', 'essay'] })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard'] })
  @ApiQuery({ name: 'category_id', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'is_public', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Excel file generated',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  async exportToExcel(
    @Query(ValidationPipe) filterDto: QuestionFilterDto,
    @Req() req: RequestWithUser,
    @Res() res: Response
  ) {
    // Add created_by filter to only export questions created by current user
    const exportFilter = {
      ...filterDto,
      created_by: req.user.userId,
    }

    const result: any = await firstValueFrom(
      this.examsService.send('questions.export.excel', exportFilter)
    )

    const buffer = Buffer.from(result.data)
    const filename = `questions_export_${new Date().toISOString().split('T')[0]}.xlsx`

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    })

    res.send(buffer)
  }

  @Get('questions/export/text')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Export questions to text file',
    description: 'Export filtered questions to plain text file'
  })
  @ApiQuery({ name: 'type', required: false, enum: ['multiple_choice', 'essay'] })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard'] })
  @ApiQuery({ name: 'category_id', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'is_public', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Text file generated',
    content: {
      'text/plain': {
        schema: {
          type: 'string'
        }
      }
    }
  })
  async exportToText(
    @Query(ValidationPipe) filterDto: QuestionFilterDto,
    @Req() req: RequestWithUser,
    @Res() res: Response
  ) {
    // Add created_by filter to only export questions created by current user
    const exportFilter = {
      ...filterDto,
      created_by: req.user.userId,
    }

    const text = await firstValueFrom(
      this.examsService.send('questions.export.text', exportFilter)
    )

    const filename = `questions_export_${new Date().toISOString().split('T')[0]}.txt`

    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${filename}"`,
    })

    res.send(text)
  }

  @Get('questions/export/docx')
  @SkipPermissionCheck()
  @ApiOperation({
    summary: 'Export questions to Word document',
    description: 'Export filtered questions to DOCX file'
  })
  @ApiQuery({ name: 'type', required: false, enum: ['multiple_choice', 'essay'] })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard'] })
  @ApiQuery({ name: 'category_id', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'is_public', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Word document generated',
    content: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  async exportToDocx(
    @Query(ValidationPipe) filterDto: QuestionFilterDto,
    @Req() req: RequestWithUser,
    @Res() res: Response
  ) {
    // Add created_by filter to only export questions created by current user
    const exportFilter = {
      ...filterDto,
      created_by: req.user.userId,
    }

    const result: any = await firstValueFrom(
      this.examsService.send('questions.export.docx', exportFilter)
    )

    const buffer = Buffer.from(result.data)
    const filename = `questions_export_${new Date().toISOString().split('T')[0]}.docx`

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    })

    res.send(buffer)
  }
}
