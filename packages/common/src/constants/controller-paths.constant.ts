/**
 * API Gateway Controller Paths.
 */
export const API_CONTROLLER_PATHS = {
  USERS: 'users',
  CLASSES: 'classes',
  MATERIALS: 'materials',
  MEETINGS: 'meetings',
  CHATS: 'chats',
  PRODUCTS: 'products',
  EXAMS: 'exams',
  QUESTIONS: 'questions',
  SUBMISSIONS: 'submissions',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  POSTS: 'posts',
} as const;

/**
 * Microservice Controller Paths.
 * For internal microservice controllers.
 */
export const MICROSERVICE_CONTROLLER_PATHS = {
  // Users Service
  USERS: 'users',
  
  // Classes Service
  CLASSES: 'classes',
  MATERIALS: 'materials',
  POSTS: 'posts',
  
  // Meetings Service
  MEETINGS: 'meetings',
  
  // Chats Service
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  
  // Exams Service
  EXAMS: 'exams',
  QUESTIONS: 'questions',
  SUBMISSIONS: 'submissions',
  SUBMISSION_ANSWERS: 'submission-answers',
  QUESTION_EXAMS: 'question-exams',
} as const;

export type ApiControllerPath = (typeof API_CONTROLLER_PATHS)[keyof typeof API_CONTROLLER_PATHS];

export type MicroserviceControllerPath = (typeof MICROSERVICE_CONTROLLER_PATHS)[keyof typeof MICROSERVICE_CONTROLLER_PATHS];
