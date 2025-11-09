import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { QuestionsService } from './questions.service'
import { QuestionsImportService } from './questions-import.service'
import {
  CreateQuestionCategoryDto,
  UpdateQuestionCategoryDto,
  CreateQuestionDto,
  QuestionFilterDto,
  UpdateQuestionDto,
  QuestionCategoryFilterDto,
  GetRandomQuestionsDto,
} from 'src/modules/questions/dto'

@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly questionsImportService: QuestionsImportService,
  ) {}

  // ============================================================
  // CATEGORY ENDPOINTS
  // ============================================================
  @MessagePattern('questions.categories.create')
  async createCategory(@Payload() createCategoryDto: CreateQuestionCategoryDto) {
    return await this.questionsService.createCategory(createCategoryDto);
  }

  @MessagePattern('questions.categories.findAll')
  async findAllCategories(@Payload() filterDto?: QuestionCategoryFilterDto) {
    return await this.questionsService.findAllCategories(filterDto);
  }

  @MessagePattern('questions.categories.findOne')
  async findCategoryById(@Payload() data: { id: number }) {
    return await this.questionsService.findCategoryById(data.id);
  }

  @MessagePattern('questions.categories.update')
  async updateCategory(@Payload() data: { id: number; updateCategoryDto: UpdateQuestionCategoryDto }) {
    return await this.questionsService.updateCategory(data.id, data.updateCategoryDto);
  }

  @MessagePattern('questions.categories.delete')
  async deleteCategory(@Payload() data: { id: number }) {
    return await this.questionsService.deleteCategory(data.id);
  }

  // ============================================================
  // QUESTION ENDPOINTS
  // ============================================================
  @MessagePattern('questions.create')
  async createQuestion(@Payload() createQuestionDto: CreateQuestionDto) {
    return await this.questionsService.createQuestion(createQuestionDto);
  }

  @MessagePattern('questions.findAll')
  async findAllQuestions(@Payload() filterDto: QuestionFilterDto) {
    return await this.questionsService.findAllQuestions(filterDto);
  }

  @MessagePattern('questions.findOne')
  async findQuestionById(@Payload() data: { id: number }) {
    return await this.questionsService.findQuestionById(data.id);
  }

  @MessagePattern('questions.update')
  async updateQuestion(@Payload() data: { id: number; updateQuestionDto: UpdateQuestionDto }) {
    return await this.questionsService.updateQuestion(data.id, data.updateQuestionDto);
  }

  @MessagePattern('questions.delete')
  async deleteQuestion(@Payload() data: { id: number }) {
    return await this.questionsService.deleteQuestion(data.id);
  }

  @MessagePattern('questions.findByCreator')
  async getQuestionsByCreator(@Payload() data: { creatorId: number; filterDto?: QuestionFilterDto }) {
    return await this.questionsService.getQuestionsByCreator(data.creatorId, data.filterDto);
  }

  @MessagePattern('questions.findByExam')
  async findQuestionsByExam(@Payload() data: { examId: number }) {
    return await this.questionsService.findQuestionsByExam(data.examId);
  }

  // ============================================================
  // IMPORT EXCEL ENDPOINTS
  // ============================================================
  @MessagePattern('questions.import.preview')
  async previewExcel(@Payload() data: { buffer: number[]; limit?: number }) {
    // Convert array back to Buffer (from TCP serialization)
    const buffer = Buffer.from(data.buffer);
    return await this.questionsImportService.previewExcel(buffer, data.limit || 10);
  }

  @MessagePattern('questions.import.execute')
  async importExcel(@Payload() data: { buffer: number[]; createdBy: number }) {
    // Convert array back to Buffer (from TCP serialization)
    const buffer = Buffer.from(data.buffer);
    return await this.questionsImportService.importExcel(buffer, data.createdBy);
  }

  // ============================================================
  // RANDOM QUESTIONS ENDPOINT
  // ============================================================
  @MessagePattern('questions.random')
  async getRandomQuestions(@Payload() data: GetRandomQuestionsDto) {
    return await this.questionsService.getRandomQuestions(data);
  }
}

