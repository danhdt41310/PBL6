/**
 * Users Service Message Patterns.
 * RPC communication patterns for Users microservice in Users service.
 */
export const USER_PATTERNS = {
  // Basic CRUD
  HELLO: 'users.get_hello',
  LIST: 'users.list',
  GET_USER: 'users.get_user',
  GET_ME: 'users.get_me',
  CREATE: 'users.create',
  UPDATE_PROFILE: 'users.update_profile',
  BLOCK_USER: 'users.block_user',
  UNBLOCK_USER: 'users.unblock_user',

  // Profile queries
  GET_LIST_BY_EMAILS: 'users.get_list_profile_by_emails',
  GET_LIST_BY_IDS: 'users.get_list_profile_by_ids',
  GET_BY_EMAIL: 'users.get_profile_by_email',
  GET_LIST_MATCH_EMAIL: 'users.get_list_profile_match_email',
  SEARCH_BY_NAME_OR_EMAIL: 'users.search_by_name_or_email',
} as const;

export type UserMessagePattern = (typeof USER_PATTERNS)[keyof typeof USER_PATTERNS];

/**
 * Authentication Message Patterns.
 * RPC communication patterns for authentication in Users service.
 */
export const AUTH_PATTERNS = {
  LOGIN: 'users.login',
  CHANGE_PASSWORD: 'users.change_password',
  FORGOT_PASSWORD: 'users.forgot_password',
  VERIFY_CODE: 'users.verify_code',
  RESET_PASSWORD: 'users.reset_password',
} as const;

export type AuthMessagePattern = (typeof AUTH_PATTERNS)[keyof typeof AUTH_PATTERNS];

/**
 * Role Management Message Patterns.
 * RPC communication patterns for role management in Users service.
 */
export const ROLE_PATTERNS = {
  GET_ALL: 'users.get_all_roles',
  CREATE: 'users.create_role',
  UPDATE: 'users.update_role',
  DELETE: 'users.delete_role',
  ASSIGN_PERMISSIONS: 'users.assign_role_permissions',
} as const;

export type RoleMessagePattern = (typeof ROLE_PATTERNS)[keyof typeof ROLE_PATTERNS];

/**
 * Permission Management Message Patterns.
 * RPC communication patterns for permission management in Users service.
 */
export const PERMISSION_PATTERNS = {
  GET_ALL: 'users.get_all_permissions',
  CREATE: 'users.create_permission',
} as const;

export type PermissionMessagePattern = (typeof PERMISSION_PATTERNS)[keyof typeof PERMISSION_PATTERNS];
