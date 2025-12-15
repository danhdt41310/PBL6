import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { QuestionsRepository } from './questions.repository'
import { PrismaClient } from '@prisma/exams-client'
import { 
  CreateQuestionDto, 
  UpdateQuestionDto, 
  QuestionFilterDto,
  CreateQuestionCategoryDto,
  UpdateQuestionCategoryDto,
  QuestionCategoryFilterDto,
  GetRandomQuestionsDto,
  RandomQuestionType,
} from './dto/question.dto'
import { TransactionClient } from 'src/prisma/prisma.type'

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionsRepository: QuestionsRepository,
  ) {}

  /**
   * Get Prisma client for transaction or regular operation
   */
  getClient(tx?: TransactionClient) {
    return tx || this.prisma
  }

  // ============================================================
  // QUESTION CATEGORIES
  // ============================================================
  async createCategory(createCategoryDto: CreateQuestionCategoryDto) {
    try {
      console.log('Creating category with name:', createCategoryDto)
      const category = await this.questionsRepository.createCategory(createCategoryDto);
      return category
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('You already have a category with this name')
      }
      throw new BadRequestException('Failed to create category: ' + error.message)
    }
  }

  async findAllCategories(filterDto?: QuestionCategoryFilterDto) {
    console.log('[Service findAllCategories] Called with:', filterDto)
    try {
      const where: any = {}

      // Filter by created_by to show only user's categories
      if (!filterDto?.created_by) {
        // Return empty array if no user specified
        return []
      }
      where.created_by = filterDto.created_by

      // Add search filter if provided
      if (filterDto?.search) {
        where.name = {
          contains: filterDto.search,
          mode: 'insensitive',
        }
      }

      const categories = await this.questionsRepository.findManyCategories(where);

      // Transform response to include question count
      return categories.map(category => ({
        ...category,
        question_count: category._count.questions,
      }))
    } catch (error) {
      throw new BadRequestException('Failed to fetch categories: ' + error.message)
    }
  }

  async findCategoryById(id: number, userId?: number) {
    try {
      // Validate ownership
      if (userId === undefined) {
        throw new BadRequestException('userId is required to fetch category')
      }

      const category = await this.questionsRepository.findCategoryById(id);

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`)
      }

      // Check ownership
      if (category.created_by !== userId) {
        throw new NotFoundException(`Category with ID ${id} not found or you don't have access`)
      }

      return category
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('Failed to fetch category: ' + error.message)
    }
  }

  async updateCategory(id: number, updateCategoryDto: UpdateQuestionCategoryDto, userId?: number) {
    try {
      // Validate ownership
      await this.findCategoryById(id, userId)

      const category = await this.questionsRepository.updateCategory(id, updateCategoryDto);

      return category
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      // Check for unique constraint violation
      if (error.code === 'P2002') {
        throw new BadRequestException('You already have a category with this name')
      }
      throw new BadRequestException('Failed to update category: ' + error.message)
    }
  }

  async deleteCategory(id: number, userId?: number) {
    try {
      // Validate ownership
      const category = await this.findCategoryById(id, userId)

      // Check if category has questions
      if (category._count.questions > 0) {
        throw new BadRequestException(
          `Cannot delete category because it has ${category._count.questions} question(s). Please reassign or delete those questions first.`
        )
      }

      await this.questionsRepository.deleteCategory(id);

      return { message: 'Category deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('Failed to delete category: ' + error.message)
    }
  }

  // ============================================================
  // QUESTIONS
  // ============================================================
  async createQuestion(createQuestionDto: CreateQuestionDto) {
    try {
      // Validate category ownership if provided
      if (createQuestionDto.category_id) {
        await this.findCategoryById(createQuestionDto.category_id, createQuestionDto.created_by)
      }

      // Validate options for multiple choice questions (new format with prefix)
      if (createQuestionDto.type === 'multiple_choice') {
        if (!createQuestionDto.options || createQuestionDto.options.length < 2) {
          throw new BadRequestException('Multiple choice questions must have at least 2 options')
        }
        
        // Check for correct answers (at least one option has prefix with =)
        const correctAnswers = createQuestionDto.options.filter(opt => opt.text.startsWith('='))
        if (correctAnswers.length === 0) {
          throw new BadRequestException('At least one option must be marked as correct (prefix with =)')
        }
        
        // Check single answer can only have one correct option
        if (!createQuestionDto.is_multiple_answer && correctAnswers.length > 1) {
          throw new BadRequestException('Single answer questions can only have one correct option')
        }

        // Validate all options have valid prefix (= or ~)
        for (const opt of createQuestionDto.options) {
          if (!opt.text.startsWith('=') && !opt.text.startsWith('~')) {
            throw new BadRequestException('All options must start with = (correct) or ~ (incorrect)')
          }
        }
      }

      const question = await this.questionsRepository.createQuestion({
        content: createQuestionDto.content,
        type: createQuestionDto.type,
        difficulty: createQuestionDto.difficulty || 'medium',
        category_id: createQuestionDto.category_id,
        is_multiple_answer: createQuestionDto.is_multiple_answer || false,
        options: createQuestionDto.options,
        created_by: createQuestionDto.created_by,
        is_public: createQuestionDto.is_public || false,
      });

      return question
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to create question: ' + error.message)
    }
  }

  async findAllQuestions(filterDto: QuestionFilterDto) {
    try {
      const page = filterDto.page || 1
      const limit = filterDto.limit || 10
      const skip = (page - 1) * limit

      const where: any = {}

      // Filter by created_by to show only user's questions
      if (!filterDto.created_by) {
        // Return empty result if no user specified
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        }
      }
      where.created_by = filterDto.created_by

      if (filterDto.type) {
        where.type = filterDto.type
      }

      if (filterDto.difficulty) {
        where.difficulty = filterDto.difficulty
      }

      if (filterDto.category_id) {
        where.category_id = filterDto.category_id
      }

      if (filterDto.is_public !== undefined) {
        where.is_public = filterDto.is_public
      }

      if (filterDto.search) {
        where.content = {
          contains: filterDto.search,
          mode: 'insensitive',
        }
      }

      const [questions, total] = await Promise.all([
        this.questionsRepository.findManyQuestions(where, skip, limit),
        this.questionsRepository.countQuestions(where),
      ])

      return {
        data: questions,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      throw new BadRequestException('Failed to fetch questions: ' + error.message)
    }
  }

  async findQuestionById(id: number) {
    try {
      const question = await this.questionsRepository.findQuestionById(id);

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`)
      }

      return question
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to fetch question: ' + error.message)
    }
  }

  async updateQuestion(id: number, updateQuestionDto: UpdateQuestionDto) {
    try {
      // First check if question exists
      const existingQuestion = await this.questionsRepository.findQuestionByIdSimple(id);

      if (!existingQuestion) {
        throw new NotFoundException(`Question with ID ${id} not found`)
      }

      // Validate category ownership if being updated
      if (updateQuestionDto.category_id) {
        await this.findCategoryById(updateQuestionDto.category_id, existingQuestion.created_by)
      }

      // Validate options if updating multiple choice question (new format with prefix)
      if (updateQuestionDto.type === 'multiple_choice' || 
          (existingQuestion.type === 'multiple_choice' && updateQuestionDto.options)) {
        if (updateQuestionDto.options && updateQuestionDto.options.length < 2) {
          throw new BadRequestException('Multiple choice questions must have at least 2 options')
        }
        
        if (updateQuestionDto.options) {
          // Check for correct answers (prefix with =)
          const correctAnswers = updateQuestionDto.options.filter(opt => opt.text.startsWith('='))
          if (correctAnswers.length === 0) {
            throw new BadRequestException('At least one option must be marked as correct (prefix with =)')
          }
          
          const isMultipleAnswer = updateQuestionDto.is_multiple_answer !== undefined 
            ? updateQuestionDto.is_multiple_answer 
            : (existingQuestion as any).is_multiple_answer
            
          if (!isMultipleAnswer && correctAnswers.length > 1) {
            throw new BadRequestException('Single answer questions can only have one correct option')
          }

          // Validate all options have valid prefix (= or ~)
          for (const opt of updateQuestionDto.options) {
            if (!opt.text.startsWith('=') && !opt.text.startsWith('~')) {
              throw new BadRequestException('All options must start with = (correct) or ~ (incorrect)')
            }
          }
        }
      }

      // Prepare update data with proper category relation handling
      const { category_id, options, ...restDto } = updateQuestionDto
      
      const updateData: any = {
        ...restDto,
      };
      
      if (category_id !== undefined) {
        updateData.category = category_id 
          ? { connect: { category_id } }
          : { disconnect: true };
      }

      const question = await this.questionsRepository.updateQuestion(id, updateData, options);

      return question
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('Failed to update question: ' + error.message)
    }
  }

  async deleteQuestion(id: number) {
    try {
      // Check if question exists
      const question = await this.questionsRepository.findQuestionWithRelations(id);

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`)
      }

      // Check if question has any submission answers
      if (question.submission_answers.length > 0) {
        throw new BadRequestException(
          'Cannot delete question because it has been answered in one or more submissions'
        )
      }

      // Check if question is being used in any exam
      if (question.question_exams.length > 0) {
        throw new BadRequestException(
          'Cannot delete question because it is being used in one or more exams'
        )
      }

      await this.questionsRepository.deleteQuestion(id);

      return { message: 'Question deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      console.error('Error deleting question:', error)
      throw new BadRequestException('Failed to delete question: ' + error.message)
    }
  }

  async getQuestionsByCreator(creatorId: number, filterDto?: QuestionFilterDto) {
    return this.findAllQuestions({ ...filterDto, created_by: creatorId })
  }

  async findQuestionsByExam(examId: number) {
    return this.questionsRepository.findQuestionsByExam(examId);
  }

  /**
   * Get random questions based on multiple criteria
   * Supports multiple_choice, true_false (which is multiple_choice with is_multiple_answer=false), and essay
   */
  async getRandomQuestions(data: GetRandomQuestionsDto) {
    try {
      const { criteria, userId } = data
      const allQuestions = []
      const summary = {
        requested: 0,
        fetched: 0,
        by_criteria: [],
      }

      // Process each criterion
      for (const criterion of criteria) {
        const { category_id, type, difficulty, quantity } = criterion
        summary.requested += quantity

        // Build the where clause
        const where: any = {}

        // Map frontend type to database type and conditions
        if (type === RandomQuestionType.TRUE_FALSE) {
          // true_false = multiple_choice with is_multiple_answer = false
          where.type = 'multiple_choice'
          where.is_multiple_answer = false
        } else if (type === RandomQuestionType.MULTIPLE_CHOICE) {
          // regular multiple choice (can have is_multiple_answer = true or false)
          where.type = 'multiple_choice'
          where.is_multiple_answer = true
        } else if (type === RandomQuestionType.ESSAY) {
          where.type = 'essay'
        }

        // Add category filter if provided
        if (category_id) {
          where.category_id = category_id
        }

        // Add difficulty filter if provided
        if (difficulty) {
          where.difficulty = difficulty
        }

        // Only fetch public questions or questions created by the user
        if (userId) {
          where.OR = [
            { is_public: true },
            { created_by: userId }
          ]
        } else {
          where.is_public = true
        }

        // Get total count for this criterion
        const totalAvailable = await this.questionsRepository.countQuestions(where);
        const randomOffset = Math.floor(Math.random() * (totalAvailable - quantity))

        // Fetch random questions with all data including options (answers)
        const questions = await this.questionsRepository.findRandomQuestions(
          where,
          randomOffset > 0 ? randomOffset : 0,
          Math.min(quantity, totalAvailable)
        );

        // Shuffle the results to get random selection
        const shuffled = this.shuffleArray(questions)
        const selected = shuffled.slice(0, quantity)

        allQuestions.push(...selected)
        
        summary.fetched += selected.length
        summary.by_criteria.push({
          category_id: category_id || null,
          type,
          requested: quantity,
          fetched: selected.length,
          available: totalAvailable,
        })
      }

      // Shuffle the final combined list
      const finalQuestions = this.shuffleArray(allQuestions)

      return {
        data: finalQuestions,
        total: finalQuestions.length,
        summary,
      }
    } catch (error) {
      throw new BadRequestException('Failed to fetch random questions: ' + error.message)
    }
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
