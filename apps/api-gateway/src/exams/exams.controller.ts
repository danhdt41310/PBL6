import { 
  Controller, 
  Get, 
  Post, 
  Put, 
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
} from '@nestjs/common'
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
  constructor(@Inject('EXAMS_SERVICE') private examsService: ClientProxy) {}

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
  async getAllExams(@Query(ValidationPipe) filterDto: ExamFilterDto) {
    return firstValueFrom(
      this.examsService.send('exams.findAll', filterDto)
    )
  }

  @Get('exams/of')
  @SkipPermissionCheck()
  @ApiOperation({ 
    summary: 'Get all exams of list class having list class_id',
    description: 'Get all exams of list class having list class_id. Returns all exams that belong to list class.'
  })
  @ApiParam({name:'class_id', required: true, type: String, description: 'class_id of class needed to retrieve all exams' })
  @ApiResponse({ status: 200, description: 'Exams retrieved successfully' })
  async getAllExamsOf(@Param() class_ids: ClassIdListDto) {
    return firstValueFrom(
      this.examsService.send('exams.findAllOf', class_ids)
    )
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
    @Body(ValidationPipe) createCategoryDto: CreateQuestionCategoryDto
  ) {
    return firstValueFrom(
      this.examsService.send('questions.categories.create', createCategoryDto)
    )
  }

  @Get('question-categories')
  @SkipPermissionCheck()
  @ApiOperation({ 
    summary: 'Get all question categories',
    description: 'Get list of all question categories with question count'
  })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getAllCategories() {
    return firstValueFrom(
      this.examsService.send('questions.categories.findAll', {})
    )
  }

  @Get('question-categories/:id')
  @SkipPermissionCheck()
  @ApiOperation({ 
    summary: 'Get category by ID',
    description: 'Get detailed information about a category'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryById(@Param('id', ParseIntPipe) id: number) {
    return firstValueFrom(
      this.examsService.send('questions.categories.findOne', { id })
    )
  }

  @Put('question-categories/:id')
  @ApiOperation({ 
    summary: 'Update category',
    description: 'Update an existing question category'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateCategoryDto: UpdateQuestionCategoryDto,
  ) {
    return firstValueFrom(
      this.examsService.send('questions.categories.update', { id, updateCategoryDto })
    )
  }

  @Delete('question-categories/:id')
  @ApiOperation({ 
    summary: 'Delete category',
    description: 'Delete a category (only if no questions use it)'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 400, description: 'Category has questions' })
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return firstValueFrom(
      this.examsService.send('questions.categories.delete', { id })
    )
  }

  // ============================================================
  // QUESTIONS
  // ============================================================
  @Post('questions')
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
    // Set creator from JWT token
    const questionData = {
      ...createQuestionDto,
      created_by: req.user?.userId || createQuestionDto.created_by,
    }
    
    return firstValueFrom(
      this.examsService.send('questions.create', questionData)
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
  @ApiQuery({ name: 'category_id', required: false, type: Number, description: 'Category ID filter' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in question content' })
  @ApiQuery({ name: 'is_public', required: false, type: Boolean, description: 'Filter by public/private' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  async getAllQuestions(
    @Query(ValidationPipe) filterDto: QuestionFilterDto,
    @Req() req: RequestWithUser
  ) {
    // If not admin, only show questions created by user or public questions
    // if (req.user?.role !== 'admin') {
    //   filterDto.created_by = req.user?.userId
    // }
    
    return firstValueFrom(
      this.examsService.send('questions.findAll', filterDto)
    )
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
  // IMPORT EXCEL
  // ============================================================
  @Post('questions/import/preview')
  @SkipPermissionCheck()
  @UseInterceptors(
    FileInterceptor('file'),
    new FileValidationInterceptor(DefaultFileUploadConfigs.EXCEL)
  )
  @ApiOperation({ 
    summary: 'Preview Excel import',
    description: 'Preview questions from Excel file before importing. Returns first 10 rows by default.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file (.xlsx or .xls)'
        },
        limit: {
          type: 'number',
          description: 'Number of rows to preview (default: 10)'
        }
      },
      required: ['file']
    }
  })
  @ApiResponse({ status: 200, description: 'Preview generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or format' })
  async previewExcelImport(
    @UploadedFile() file: Express.Multer.File,
    @Query('limit') limit?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    return firstValueFrom(
      this.examsService.send('questions.import.preview', {
        buffer: Array.from(file.buffer), // Convert Buffer to array for TCP serialization
        limit: limit ? parseInt(limit) : 10,
      })
    )
  }

  @Post('questions/import/execute')
  @SkipPermissionCheck()
  @UseInterceptors(
    FileInterceptor('file'),
    new FileValidationInterceptor(DefaultFileUploadConfigs.EXCEL)
  )
  @ApiOperation({ 
    summary: 'Import questions from Excel',
    description: 'Import questions from Excel file. Creator ID will be set from JWT token. Returns import results with errors if any.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file (.xlsx or .xls)'
        }
      },
      required: ['file']
    }
  })
  @ApiResponse({ status: 200, description: 'Import completed (check response for errors)' })
  @ApiResponse({ status: 400, description: 'Invalid file or format' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires teacher role' })
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    const createdBy = req.user?.userId
    if (!createdBy) {
      throw new BadRequestException('User ID not found in token')
    }

    return firstValueFrom(
      this.examsService.send('questions.import.execute', {
        buffer: Array.from(file.buffer), // Convert Buffer to array for TCP serialization
        createdBy,
      })
    )
  }
}
