export enum ExamStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface QuestionInExamDto {
  question_id: number
  order: number
  points: number
}

export interface CreateExamDto {
  class_id: number
  title: string
  start_time: Date | string
  end_time: Date | string
  total_time: number // in minutes
  description?: string
  status?: ExamStatus
  created_by: number
  questions: QuestionInExamDto[] // Array of questions with their order and points
}

export interface UpdateExamDto {
  class_id?: number
  title?: string
  start_time?: Date | string
  end_time?: Date | string
  total_time?: number
  description?: string
  status?: ExamStatus
  questions?: QuestionInExamDto[]
}

export interface ExamFilterDto {
  search?: string
  status?: ExamStatus
  start_time?: string
  end_time?: string
  page?: number
  limit?: number
}
