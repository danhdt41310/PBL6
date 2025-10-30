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
 * Example: { id: 'OOP', content: 'Encapsulation', is_correct: true }
 */
export interface QuestionOptionDto {
  id: string
  content: string
  is_correct: boolean
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
}

export interface UpdateQuestionCategoryDto {
  name?: string
  description?: string
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
