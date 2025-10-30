import { IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional, IsInt, IsArray, ValidateNested, Min, Max, MinLength } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

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
    description: 'Unique identifier for the option',
    example: 'opt_1'
  })
  @IsNotEmpty({ message: 'Option ID is required' })
  @IsString()
  id: string

  @ApiProperty({ 
    description: 'Content of the option',
    example: 'Paris'
  })
  @IsNotEmpty({ message: 'Option content is required' })
  @IsString()
  @MinLength(1, { message: 'Option content must not be empty' })
  content: string

  @ApiProperty({ 
    description: 'Whether this option is correct',
    example: true
  })
  @IsBoolean()
  is_correct: boolean
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
    description: 'User ID who created this question (auto-filled from JWT)',
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
    description: 'Filter by category ID',
    example: 1
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  category_id?: number

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
    example: 'capital'
  })
  @IsOptional()
  @IsString()
  search?: string
}
