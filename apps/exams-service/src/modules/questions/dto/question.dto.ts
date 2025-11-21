/**
 * Types of questions
 */
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  ESSAY = 'essay',
}

/**
 * Difficulty levels for questions
 */
export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

/**
 * Options for multiple choice questions
 * Text uses prefix to indicate correctness:
 * - "=" prefix for correct answer
 * - "~" prefix for incorrect answer
 * Example: { id: 1, text: '=Encapsulation' } or { id: 2, text: '~Inheritance' }
 */
export interface QuestionOptionDto {
  id: number
  text: string
}

export interface CreateQuestionDto {
  content: string
  type: QuestionType
  difficulty?: QuestionDifficulty
  category_id?: number
  is_multiple_answer?: boolean
  options?: QuestionOptionDto[]
  created_by: number
  is_public?: boolean
}

export interface UpdateQuestionDto {
  content?: string
  type?: QuestionType
  difficulty?: QuestionDifficulty
  category_id?: number
  is_multiple_answer?: boolean
  options?: QuestionOptionDto[]
  is_public?: boolean
}

export interface CreateQuestionCategoryDto {
  name: string
  description?: string
  created_by: number
}

export interface UpdateQuestionCategoryDto {
  name?: string
  description?: string
}

export interface QuestionCategoryFilterDto {
  search?: string
  created_by?: number
}

export interface QuestionFilterDto {
  type?: QuestionType
  difficulty?: QuestionDifficulty
  category_id?: number
  created_by?: number
  is_public?: boolean
  page?: number
  limit?: number
  search?: string
}

/**
 * Random question types - includes true_false as separate type
 */
export enum RandomQuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  ESSAY = 'essay',
}

/**
 * Question difficulty levels
 */
export enum RandomQuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

/**
 * Criteria for fetching random questions
 */
export interface RandomQuestionCriteriaDto {
  category_id?: number
  type: RandomQuestionType
  difficulty?: RandomQuestionDifficulty
  quantity: number
}

/**
 * Request DTO for getting random questions
 */
export interface GetRandomQuestionsDto {
  criteria: RandomQuestionCriteriaDto[]
  userId?: number
}
