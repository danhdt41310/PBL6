import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Single Question Item DTO for import
 */
export class ImportQuestionItemDto {
  @ApiProperty({ example: 'What is the capital of France?', description: 'Question content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'multiple_choice', description: 'Question type', enum: ['multiple_choice', 'essay'] })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ example: 'Geography', description: 'Category name' })
  @IsString()
  @IsOptional()
  category_name?: string;

  @ApiPropertyOptional({ example: 'easy', description: 'Question difficulty', enum: ['easy', 'medium', 'hard'] })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiPropertyOptional({ example: 'false', description: 'Allow multiple correct answers' })
  @IsString()
  @IsOptional()
  is_multiple_answer?: string;

  // Option A
  @ApiPropertyOptional({ example: 'Paris', description: 'Option A text' })
  @IsString()
  @IsOptional()
  F?: string;

  @ApiPropertyOptional({ example: 'true', description: 'Option A is correct' })
  @IsString()
  @IsOptional()
  G?: string;

  // Option B
  @ApiPropertyOptional({ example: 'London', description: 'Option B text' })
  @IsString()
  @IsOptional()
  H?: string;

  @ApiPropertyOptional({ example: 'false', description: 'Option B is correct' })
  @IsString()
  @IsOptional()
  I?: string;

  // Option C
  @ApiPropertyOptional({ example: 'Berlin', description: 'Option C text' })
  @IsString()
  @IsOptional()
  J?: string;

  @ApiPropertyOptional({ example: 'false', description: 'Option C is correct' })
  @IsString()
  @IsOptional()
  K?: string;

  // Option D
  @ApiPropertyOptional({ example: 'Madrid', description: 'Option D text' })
  @IsString()
  @IsOptional()
  L?: string;

  @ApiPropertyOptional({ example: 'false', description: 'Option D is correct' })
  @IsString()
  @IsOptional()
  M?: string;

  // Option E
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  N?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  O?: string;

  // Option F
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  P?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  Q?: string;

  // Option G
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  R?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  S?: string;

  // Option H
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  T?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  U?: string;

  @ApiPropertyOptional({ example: 'true', description: 'Is question public' })
  @IsString()
  @IsOptional()
  is_public?: string;
}

/**
 * Import Questions Array DTO
 */
export class ImportQuestionsArrayDto {
  @ApiProperty({ 
    description: 'Array of questions to import',
    type: [ImportQuestionItemDto],
    example: [{
      content: 'What is 2+2?',
      type: 'multiple_choice',
      category_name: 'Math',
      difficulty: 'easy',
      F: '3',
      G: 'false',
      H: '4',
      I: 'true',
      J: '5',
      K: 'false',
      is_public: 'true'
    }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportQuestionItemDto)
  questions: ImportQuestionItemDto[];
}
