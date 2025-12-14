/**
 * Exam Management Message Patterns.
 * RPC communication patterns for exam operations.
 */
export const EXAM_PATTERNS = {
  CREATE: 'exams.create',
  GET_BY_ID: 'exams.get_by_id',
  GET_ALL: 'exams.get_all',
  UPDATE: 'exams.update',
  DELETE: 'exams.delete',
  START: 'exams.start',
  SUBMIT: 'exams.submit',
} as const;

export type ExamMessagePattern = (typeof EXAM_PATTERNS)[keyof typeof EXAM_PATTERNS];

/**
 * Question Management Message Patterns.
 * RPC communication patterns for exam question operations.
 */
export const QUESTION_PATTERNS = {
  CREATE: 'exams.create_question',
  GET_BY_EXAM: 'exams.get_questions',
  UPDATE: 'exams.update_question',
  DELETE: 'exams.delete_question',
  IMPORT: 'exams.import_questions',
  EXPORT: 'exams.export_questions',
} as const;

export type QuestionMessagePattern = (typeof QUESTION_PATTERNS)[keyof typeof QUESTION_PATTERNS];

/**
 * Submission Management Message Patterns.
 * RPC communication patterns for exam submission operations.
 */
export const SUBMISSION_PATTERNS = {
  CREATE: 'exams.create_submission',
  GET_BY_EXAM: 'exams.get_submissions',
  GET_BY_USER: 'exams.get_user_submissions',
  GRADE: 'exams.grade_submission',
} as const;

export type SubmissionMessagePattern = (typeof SUBMISSION_PATTERNS)[keyof typeof SUBMISSION_PATTERNS];
