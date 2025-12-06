import { IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional, IsInt, IsArray, ValidateNested, Min, Max, MinLength, IsNumber } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Optional } from '@nestjs/common'

// Question DTOs
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  ESSAY = 'essay',
}

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export class QuestionOptionDto {
  @ApiProperty({
    description: 'Unique identifier for the option (auto-assigned)',
    example: 1
  })
  @IsNotEmpty({ message: 'Option ID is required' })
  @IsNumber()
  id: number

  @ApiProperty({
    description: 'Option text with prefix: "=" for correct, "~" for incorrect',
    example: '=Encapsulation'
  })
  @IsNotEmpty({ message: 'Option text is required' })
  @IsString()
  @MinLength(2, { message: 'Option text must not be empty (minimum 2 chars including prefix)' })
  text: string
}

// ============================================================
// QUESTION CATEGORY DTOs
// ============================================================
export class CreateQuestionCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Mathematics',
    minLength: 2
  })
  @IsNotEmpty({ message: 'Category name is required' })
  @IsString()
  @MinLength(2, { message: 'Category name must be at least 2 characters' })
  name: string

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Questions related to mathematics and calculations'
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    description: 'User ID who created this category',
    example: 1
  })
  @IsNotEmpty({ message: 'Creator ID is required' })
  @IsInt()
  created_by: number
}

export class UpdateQuestionCategoryDto {
  @ApiPropertyOptional({
    description: 'Category name',
    example: 'OOP',
    minLength: 2
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Category name must be at least 2 characters' })
  name?: string

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Advanced object-oriented programming concepts and principles'
  })
  @IsOptional()
  @IsString()
  description?: string
}

// ============================================================
// QUESTION DTOs
// ============================================================
export class CreateQuestionDto {
  @ApiProperty({
    description: 'Question content/text',
    example: 'How many OOP principles are there?',
    minLength: 10
  })
  @IsNotEmpty({ message: 'Question content is required' })
  @IsString()
  @MinLength(10, { message: 'Question content must be at least 10 characters' })
  content: string

  @ApiProperty({
    description: 'Type of question',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE
  })
  @IsEnum(QuestionType, { message: 'Invalid question type' })
  type: QuestionType

  @ApiPropertyOptional({
    description: 'Difficulty level',
    enum: QuestionDifficulty,
    example: QuestionDifficulty.EASY
  })
  @IsOptional()
  @IsEnum(QuestionDifficulty, { message: 'Invalid difficulty level' })
  difficulty?: QuestionDifficulty

  @ApiPropertyOptional({
    description: 'Category ID this question belongs to',
    example: 1
  })
  @IsOptional()
  @IsInt({ message: 'Category ID must be a number' })
  @Type(() => Number)
  category_id?: number

  @ApiPropertyOptional({
    description: 'Whether multiple answers are correct (for MCQ)',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  is_multiple_answer?: boolean

  @ApiPropertyOptional({
    description: 'Answer options (required for multiple choice questions)',
    type: [QuestionOptionDto],
    example: [
      { id: 'opt_1', content: '4', is_correct: true },
      { id: 'opt_2', content: '2', is_correct: false },
      { id: 'opt_3', content: '5', is_correct: false },
      { id: 'opt_4', content: '1', is_correct: false }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[]

  @ApiProperty({
    description: 'User ID who created this question',
    example: 1
  })
  @IsNotEmpty({ message: 'Creator ID is required' })
  @IsInt()
  created_by: number

  @ApiPropertyOptional({
    description: 'Whether question is publicly visible',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({
    description: 'Question content/text',
    example: 'What is the capital city of France?',
    minLength: 10
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Question content must be at least 10 characters' })
  content?: string

  @ApiPropertyOptional({
    description: 'Type of question',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE
  })
  @IsOptional()
  @IsEnum(QuestionType, { message: 'Invalid question type' })
  type?: QuestionType

  @ApiPropertyOptional({
    description: 'Difficulty level',
    enum: QuestionDifficulty,
    example: QuestionDifficulty.MEDIUM
  })
  @IsOptional()
  @IsEnum(QuestionDifficulty, { message: 'Invalid difficulty level' })
  difficulty?: QuestionDifficulty

  @ApiPropertyOptional({
    description: 'Category ID this question belongs to',
    example: 2
  })
  @IsOptional()
  @IsInt({ message: 'Category ID must be a number' })
  @Type(() => Number)
  category_id?: number

  @ApiPropertyOptional({
    description: 'Whether multiple answers are correct (for MCQ)',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  is_multiple_answer?: boolean

  @ApiPropertyOptional({
    description: 'Answer options (for multiple choice questions)',
    type: [QuestionOptionDto],
    example: [
      { id: 'opt_1', content: 'Paris', is_correct: true },
      { id: 'opt_2', content: 'London', is_correct: false }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[]

  @ApiPropertyOptional({
    description: 'Whether question is publicly visible',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean
}

export class QuestionFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by question type',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE
  })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType

  @ApiPropertyOptional({
    description: 'Filter by difficulty level',
    enum: QuestionDifficulty,
    example: QuestionDifficulty.EASY
  })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty

  @ApiPropertyOptional({
    description: 'Filter by single category ID',
    example: 1
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  category_id?: number

  @ApiPropertyOptional({
    description: 'Filter by multiple category IDs',
    example: [1, 2, 3],
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    // Handle both array and single value from query string
    if (!value) return undefined
    if (Array.isArray(value)) return value.map(v => parseInt(String(v), 10))
    return [parseInt(String(value), 10)]
  })
  category_ids?: number[]

  @ApiPropertyOptional({
    description: 'Filter by creator user ID',
    example: 1
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  created_by?: number

  @ApiPropertyOptional({
    description: 'Filter by public/private status',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_public?: boolean

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number

  @ApiPropertyOptional({
    description: 'Search text in question content',
    example: 'What is OOP'
  })
  @IsOptional()
  @IsString()
  search?: string
}

// ============================================================
// EXAM DTOs
// ============================================================
export enum ExamStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class QuestionInExamDto {
  @ApiProperty({
    description: 'Question ID',
    example: 1
  })
  @IsNotEmpty({ message: 'Question ID is required' })
  @IsInt({ message: 'Question ID must be a number' })
  question_id: number

  @ApiProperty({
    description: 'Order/position of question in exam',
    example: 1,
    minimum: 1
  })
  @IsNotEmpty({ message: 'Question order is required' })
  @IsInt({ message: 'Order must be a number' })
  @Min(0, { message: 'Order must be at least 0' })
  order: number

  @ApiProperty({
    description: 'Points awarded for this question',
    example: 10,
    minimum: 1
  })
  @IsNotEmpty({ message: 'Points are required' })
  @IsNumber(
    { allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'Points must be a valid number (up to 2 decimal places)' }
  )
  @Min(1, { message: 'Points must be at least 1' })
  points: number
}

export class CreateExamDto {
  @ApiProperty({
    description: 'Class ID this exam belongs to',
    example: 1
  })
  @IsNotEmpty({ message: 'Class ID is required' })
  @IsInt({ message: 'Class ID must be a number' })
  class_id: number

  @ApiProperty({
    description: 'Exam title',
    example: 'Midterm Exam - OOP Fundamentals',
    minLength: 5
  })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  @MinLength(5, { message: 'Title must be at least 5 characters' })
  title: string

  @ApiProperty({
    description: 'Exam start time (ISO 8601 format)',
    example: '2024-12-01T09:00:00Z'
  })
  @IsNotEmpty({ message: 'Start time is required' })
  @IsString()
  start_time: string

  @ApiProperty({
    description: 'Exam end time (ISO 8601 format)',
    example: '2024-12-01T11:00:00Z'
  })
  @IsNotEmpty({ message: 'End time is required' })
  @IsString()
  end_time: string

  @ApiProperty({
    description: 'Total time allowed for exam in minutes',
    example: 90,
    minimum: 1
  })
  @IsNotEmpty({ message: 'Total time is required' })
  @IsInt({ message: 'Total time must be a number' })
  @Min(1, { message: 'Total time must be at least 1 minute' })
  total_time: number

  @ApiPropertyOptional({
    description: 'Exam description/instructions',
    example: 'This is a comprehensive midterm exam covering OOP principles...'
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({
    description: 'Exam status',
    enum: ExamStatus,
    example: ExamStatus.DRAFT,
    default: ExamStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(ExamStatus, { message: 'Invalid exam status' })
  status?: ExamStatus

  @ApiProperty({
    description: 'User ID who created this exam (auto-filled from JWT)',
    example: 1
  })
  @IsNotEmpty({ message: 'Creator ID is required' })
  @IsInt()
  created_by: number

  @ApiProperty({
    description: 'Array of questions with their order and points',
    type: [QuestionInExamDto],
    example: [
      { question_id: 1, order: 1, points: 10 },
      { question_id: 2, order: 2, points: 15 },
      { question_id: 3, order: 3, points: 20 }
    ]
  })
  @IsArray({ message: 'Questions must be an array' })
  @ValidateNested({ each: true })
  @Type(() => QuestionInExamDto)
  questions: QuestionInExamDto[]
}

export class UpdateExamDto {
  @ApiPropertyOptional({
    description: 'Class ID this exam belongs to',
    example: 1
  })
  @IsOptional()
  @IsInt({ message: 'Class ID must be a number' })
  class_id?: number

  @ApiPropertyOptional({
    description: 'Exam title',
    example: 'Updated Midterm Exam',
    minLength: 5
  })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Title must be at least 5 characters' })
  title?: string

  @ApiPropertyOptional({
    description: 'Exam start time (ISO 8601 format)',
    example: '2024-12-01T09:00:00Z'
  })
  @IsOptional()
  @IsString()
  start_time?: string

  @ApiPropertyOptional({
    description: 'Exam end time (ISO 8601 format)',
    example: '2024-12-01T11:00:00Z'
  })
  @IsOptional()
  @IsString()
  end_time?: string

  @ApiPropertyOptional({
    description: 'Total time allowed for exam in minutes',
    example: 90,
    minimum: 1
  })
  @IsOptional()
  @IsInt({ message: 'Total time must be a number' })
  @Min(1, { message: 'Total time must be at least 1 minute' })
  total_time?: number

  @ApiPropertyOptional({
    description: 'Exam description/instructions',
    example: 'Updated exam description...'
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({
    description: 'Exam status',
    enum: ExamStatus,
    example: ExamStatus.PUBLISHED
  })
  @IsOptional()
  @IsEnum(ExamStatus, { message: 'Invalid exam status' })
  status?: ExamStatus

  @ApiPropertyOptional({
    description: 'Array of questions with their order and points (replaces all existing questions)',
    type: [QuestionInExamDto],
    example: [
      { question_id: 1, order: 1, points: 10 },
      { question_id: 2, order: 2, points: 15 }
    ]
  })
  @IsOptional()
  @IsArray({ message: 'Questions must be an array' })
  @ValidateNested({ each: true })
  @Type(() => QuestionInExamDto)
  questions?: QuestionInExamDto[]
}

export class ExamFilterDto {
  @ApiPropertyOptional({
    description: 'Search text in exam title or description',
    example: 'midterm'
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({
    description: 'Filter by exam status',
    enum: ExamStatus,
    example: ExamStatus.PUBLISHED
  })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus

  @ApiPropertyOptional({
    description: 'Filter start time - exams with start_time >= this value (ISO 8601 format)',
    example: '2024-12-01T00:00:00Z'
  })
  @IsOptional()
  @IsString()
  start_time?: string

  @ApiPropertyOptional({
    description: 'Filter end time - exams with end_time <= this value (ISO 8601 format)',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsString()
  end_time?: string

  @ApiPropertyOptional({
    description: 'Filter by creator ID',
    example: 1
  })
  @IsOptional()
  @IsInt({ message: 'Creator ID must be a number' })
  @Type(() => Number)
  created_by?: number

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number
}

// ============================================================
// RANDOM QUESTIONS DTOs
// ============================================================
export enum RandomQuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  ESSAY = 'essay',
}

export enum RandomQuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export class RandomQuestionCriteriaDto {
  @ApiPropertyOptional({
    description: 'Category ID to filter questions (optional)',
    example: 1
  })
  @IsOptional()
  @IsInt({ message: 'Category ID must be a number' })
  @Type(() => Number)
  category_id?: number

  @ApiProperty({
    description: 'Type of questions to fetch (multiple_choice, true_false, essay)',
    enum: RandomQuestionType,
    example: RandomQuestionType.MULTIPLE_CHOICE
  })
  @IsNotEmpty({ message: 'Question type is required' })
  @IsEnum(RandomQuestionType, { message: 'Invalid question type' })
  type: RandomQuestionType

  @ApiPropertyOptional({
    description: 'Difficulty level (easy, medium, hard)',
    enum: RandomQuestionDifficulty,
    example: RandomQuestionDifficulty.MEDIUM
  })
  @IsOptional()
  @IsEnum(RandomQuestionDifficulty, { message: 'Invalid difficulty level' })
  difficulty?: RandomQuestionDifficulty

  @ApiProperty({
    description: 'Number of questions to fetch',
    example: 10,
    minimum: 1
  })
  @IsNotEmpty({ message: 'Quantity is required' })
  @IsInt({ message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number
}

export class GetRandomQuestionsDto {
  @ApiProperty({
    description: 'Array of criteria for fetching random questions',
    type: [RandomQuestionCriteriaDto],
    example: [
      { category_id: 1, type: 'multiple_choice', difficulty: 'easy', quantity: 12 },
      { category_id: 2, type: 'true_false', difficulty: 'medium', quantity: 8 },
      { type: 'essay', quantity: 5 }
    ]
  })
  @IsArray({ message: 'Criteria must be an array' })
  @ValidateNested({ each: true })
  @Type(() => RandomQuestionCriteriaDto)
  criteria: RandomQuestionCriteriaDto[]
}

// ============================================================
// SUBMISSION DTOs (for exam taking)
// ============================================================
export class SubmitAnswerDto {
  @ApiProperty({
    description: 'Question ID',
    example: 1
  })
  @IsNotEmpty({ message: 'Question ID is required' })
  @IsInt({ message: 'Question ID must be a number' })
  question_id: number

  @ApiProperty({
    description: 'Answer content (JSON string for multiple choice, plain text for essay)',
    example: '["opt_1"]'
  })
  @IsNotEmpty({ message: 'Answer content is required' })
  @IsString()
  answer_content: string
}

export class UpdateRemainingTimeDto {
  @ApiProperty({
    description: 'Remaining time in seconds',
    example: 3600,
    minimum: 0
  })
  @IsNotEmpty({ message: 'Remaining time is required' })
  @IsInt({ message: 'Remaining time must be a number' })
  @Min(0, { message: 'Remaining time cannot be negative' })
  remaining_time: number
}

export class ClassIdListDto {

  @ApiPropertyOptional({
    description: 'list of class_id that needed to find all exams related',
    example: [1, 2, 3, 4, 10]
  })
  @IsArray()
  @Transform(({ value }) => value.map(v => parseInt(v)))
  class_ids: number[]
}

export class AnswerCorrectnessDto {
  @IsString()
  student_answer: string

  @IsString()
  correct_answer: string
}