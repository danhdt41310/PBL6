/**
 * Application Configuration Constants.
 * Shared configuration values across all microservices.
 */
export const APP_CONFIG = {
  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MAX_SEARCH_RESULTS: 1000,
  SEARCH_RESULTS_LIMIT: 1000, // Alias for MAX_SEARCH_RESULTS

  // Authentication
  SALT_ROUNDS: 10,
  ACCESS_TOKEN_EXPIRY: '1d',
  REFRESH_TOKEN_EXPIRY: '7d',
  DEFAULT_ROLE: 'user',

  // Verification
  VERIFICATION_CODE_EXPIRY_MINUTES: 10,
  VERIFICATION_CODE_LENGTH: 6,

  // Timeouts
  DEFAULT_TIMEOUT_MS: 30000,
  LONG_TIMEOUT_MS: 60000,

  // File upload
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

export type AppConfigKey = keyof typeof APP_CONFIG;

export type AppConfig = (typeof APP_CONFIG)[keyof typeof APP_CONFIG];

/**
 * User Roles.
 * Available default user roles in the system.
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  USER: 'user',
} as const;

export type UserRoleKey = keyof typeof USER_ROLES;

export type UserRoles = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * User Status.
 * Available user statuses.
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  PENDING: 'pending',
  DELETED: 'deleted',
} as const;

export type UserStatusKey = keyof typeof USER_STATUS;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
