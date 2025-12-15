/**
 * Error Messages Constants
 * Centralized error messages for consistent error handling across the application
 */

// Conversation Error Messages
export const CONVERSATION_ERRORS = {
  NOT_FOUND: 'Conversation not found',
  ALREADY_EXISTS: 'Conversation already exists between these users',
  SELF_CONVERSATION: 'Cannot create conversation with yourself',
  INVALID_USER_REFERENCE: 'Invalid user reference',
  CREATE_FAILED: 'Failed to create conversation',
  UPDATE_FAILED: 'Failed to update conversation',
  DELETE_FAILED: 'Failed to delete conversation',
  FIND_FAILED: 'Failed to find conversation',
} as const;

// Message Error Messages
export const MESSAGE_ERRORS = {
  NOT_FOUND: 'Message not found',
  CREATE_FAILED: 'Failed to create message',
  UPDATE_FAILED: 'Failed to update message',
  DELETE_FAILED: 'Failed to delete message',
  FIND_FAILED: 'Failed to find messages',
  MARK_READ_FAILED: 'Failed to mark messages as read',
  INVALID_CONVERSATION: 'Invalid conversation reference',
  ALREADY_EXISTS: 'Message already exists',
} as const;

// Validation Error Messages
export const VALIDATION_ERRORS = {
  INVALID_ID: 'Invalid ID provided',
  INVALID_PAGE: 'Invalid page number',
  INVALID_LIMIT: 'Invalid limit value',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  INVALID_MESSAGE_TYPE: 'Invalid message type',
  INVALID_EMAIL: 'Invalid email format',
} as const;

// Database Error Messages
export const DATABASE_ERRORS = {
  CONNECTION_FAILED: 'Database connection failed',
  QUERY_FAILED: 'Database query failed',
  TRANSACTION_FAILED: 'Database transaction failed',
  CONSTRAINT_VIOLATION: 'Database constraint violation',
  UNIQUE_CONSTRAINT: 'Unique constraint violation',
  FOREIGN_KEY_CONSTRAINT: 'Foreign key constraint violation',
  RECORD_NOT_FOUND: 'Record not found in database',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CONVERSATION_CREATED: 'Conversation created successfully',
  CONVERSATION_UPDATED: 'Conversation updated successfully',
  CONVERSATION_DELETED: 'Conversation deleted successfully',
  MESSAGE_CREATED: 'Message created successfully',
  MESSAGE_UPDATED: 'Message updated successfully',
  MESSAGE_DELETED: 'Message deleted successfully',
  MESSAGES_MARKED_READ: 'Messages marked as read successfully',
} as const;

// General Error Messages
export const GENERAL_ERRORS = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
  NOT_FOUND: 'Resource not found',
  TIMEOUT: 'Request timeout',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
} as const;

// Prisma Error Codes Mapping
export const PRISMA_ERROR_CODES = {
  UNIQUE_CONSTRAINT: 'P2002',
  RECORD_NOT_FOUND: 'P2025',
  FOREIGN_KEY_CONSTRAINT: 'P2003',
  INVALID_INPUT: 'P2000',
  TIMEOUT: 'P2024',
} as const;

// Export all error messages
export const ERROR_MESSAGES = {
  CONVERSATION: CONVERSATION_ERRORS,
  MESSAGE: MESSAGE_ERRORS,
  VALIDATION: VALIDATION_ERRORS,
  DATABASE: DATABASE_ERRORS,
  GENERAL: GENERAL_ERRORS,
  PRISMA_CODES: PRISMA_ERROR_CODES,
} as const;
