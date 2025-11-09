import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get Prisma client for transaction or regular operation
   */
  getClient(tx?: TransactionClient) {
    return tx || this.prisma
  }

  // =============== QUESTION CATEGORIES ===============
  
  async createCategory(createCategoryDto: CreateQuestionCategoryDto) {
    try {
      console.log('Creating category with name:', createCategoryDto)
      const category = await this.prisma.questionCategory.create({
        data: createCategoryDto,
      })
      return category
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Category name already exists')
      }
      throw new BadRequestException('Failed to create category: ' + error.message)
    }
  }

  async findAllCategories(filterDto?: QuestionCategoryFilterDto) {
    try {
      const where: any = {}

      // Add search filter if provided
      if (filterDto?.search) {
        where.name = {
          contains: filterDto.search,
          mode: 'insensitive',
        }
      }

      const categories = await this.prisma.questionCategory.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
        include: {
          _count: {
            select: { questions: true },
          },
        },
      })

      // Transform response to include question count
      return categories.map(category => ({
        ...category,
        question_count: category._count.questions,
      }))
    } catch (error) {
      throw new BadRequestException('Failed to fetch categories: ' + error.message)
    }
  }

  async findCategoryById(id: number) {
    try {
      const category = await this.prisma.questionCategory.findUnique({
        where: { category_id: id },
        include: {
          _count: {
            select: { questions: true },
          },
        },
      })

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`)
      }

      return category
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to fetch category: ' + error.message)
    }
  }

  async updateCategory(id: number, updateCategoryDto: UpdateQuestionCategoryDto) {
    try {
      await this.findCategoryById(id)

      const category = await this.prisma.questionCategory.update({
        where: { category_id: id },
        data: updateCategoryDto,
      })

      return category
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Category name already exists')
      }
      throw new BadRequestException('Failed to update category: ' + error.message)
    }
  }

  async deleteCategory(id: number) {
    try {
      const category = await this.findCategoryById(id)

      // Check if category has questions
      if (category._count.questions > 0) {
        throw new BadRequestException(
          `Cannot delete category because it has ${category._count.questions} question(s). Please reassign or delete those questions first.`
        )
      }

      await this.prisma.questionCategory.delete({
        where: { category_id: id },
      })

      return { message: 'Category deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('Failed to delete category: ' + error.message)
    }
  }

  // =============== QUESTIONS ===============

  async createQuestion(createQuestionDto: CreateQuestionDto) {
    try {
      // Validate options for multiple choice questions
      if (createQuestionDto.type === 'multiple_choice') {
        if (!createQuestionDto.options || createQuestionDto.options.length < 2) {
          throw new BadRequestException('Multiple choice questions must have at least 2 options')
        }
        
        const correctAnswers = createQuestionDto.options.filter(opt => opt.is_correct)
        if (correctAnswers.length === 0) {
          throw new BadRequestException('At least one option must be marked as correct')
        }
        
        if (!createQuestionDto.is_multiple_answer && correctAnswers.length > 1) {
          throw new BadRequestException('Single answer questions can only have one correct option')
        }
      }

      // Validate category exists if provided
      if (createQuestionDto.category_id) {
        await this.findCategoryById(createQuestionDto.category_id)
      }

      const question = await this.prisma.question.create({
        data: {
          content: createQuestionDto.content,
          type: createQuestionDto.type,
          difficulty: createQuestionDto.difficulty || 'medium',
          category_id: createQuestionDto.category_id,
          is_multiple_answer: createQuestionDto.is_multiple_answer || false,
          options: createQuestionDto.options as any,
          created_by: createQuestionDto.created_by,
          is_public: createQuestionDto.is_public || false,
        },
        include: {
          category: true,
        },
      })

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

      if (filterDto.type) {
        where.type = filterDto.type
      }

      if (filterDto.difficulty) {
        where.difficulty = filterDto.difficulty
      }

      if (filterDto.category_id) {
        where.category_id = filterDto.category_id
      }

      if (filterDto.created_by) {
        where.created_by = filterDto.created_by
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
        this.prisma.question.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            created_at: 'desc',
          },
          include: {
            category: true,
          },
        }),
        this.prisma.question.count({ where }),
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
      const question = await this.prisma.question.findUnique({
        where: { question_id: id },
        include: {
          category: true,
          question_exams: {
            include: {
              exam: {
                select: {
                  exam_id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
      })

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
      const existingQuestion = await this.prisma.question.findUnique({
        where: { question_id: id },
      })

      if (!existingQuestion) {
        throw new NotFoundException(`Question with ID ${id} not found`)
      }

      // Validate category exists if being updated
      if (updateQuestionDto.category_id) {
        await this.findCategoryById(updateQuestionDto.category_id)
      }

      // Validate options if updating multiple choice question
      if (updateQuestionDto.type === 'multiple_choice' || 
          (existingQuestion.type === 'multiple_choice' && updateQuestionDto.options)) {
        if (updateQuestionDto.options && updateQuestionDto.options.length < 2) {
          throw new BadRequestException('Multiple choice questions must have at least 2 options')
        }
        
        if (updateQuestionDto.options) {
          const correctAnswers = updateQuestionDto.options.filter(opt => opt.is_correct)
          if (correctAnswers.length === 0) {
            throw new BadRequestException('At least one option must be marked as correct')
          }
          
          const isMultipleAnswer = updateQuestionDto.is_multiple_answer !== undefined 
            ? updateQuestionDto.is_multiple_answer 
            : (existingQuestion as any).is_multiple_answer
            
          if (!isMultipleAnswer && correctAnswers.length > 1) {
            throw new BadRequestException('Single answer questions can only have one correct option')
          }
        }
      }

      const question = await this.prisma.question.update({
        where: { question_id: id },
        data: {
          ...updateQuestionDto,
          options: updateQuestionDto.options as any,
        },
        include: {
          category: true,
        },
      })

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
      const question = await this.prisma.question.findUnique({
        where: { question_id: id },
        include: {
          question_exams: true,
        },
      })

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`)
      }

      // Check if question is being used in any exam
      if (question.question_exams.length > 0) {
        throw new BadRequestException(
          'Cannot delete question because it is being used in one or more exams'
        )
      }

      await this.prisma.question.delete({
        where: { question_id: id },
      })

      return { message: 'Question deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('Failed to delete question: ' + error.message)
    }
  }

  async getQuestionsByCreator(creatorId: number, filterDto?: QuestionFilterDto) {
    return this.findAllQuestions({ ...filterDto, created_by: creatorId })
  }

  async findQuestionsByExam(examId: number) {
    return this.prisma.question.findMany({
      where: {
        question_exams: {
          some: {
            exam_id: examId,
          },
        },
      },
      include: {
        category: true,
        question_exams: {
          include: {
            exam: true,
          },
        },
      },
    })
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
        const { category_id, type, quantity } = criterion
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
        const totalAvailable = await this.prisma.question.count({ where })
        const randomOffset = Math.floor(Math.random() * (totalAvailable - quantity))

        // Fetch random questions with all data including options (answers)
        const questions = await this.prisma.question.findMany({
          where,
          skip: randomOffset > 0 ? randomOffset : 0,
          take: Math.min(quantity, totalAvailable),
          include: {
            category: true,
          },
          orderBy: {
            question_id: 'asc',
          },
        })


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
