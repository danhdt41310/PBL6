/**
 * Audit Log Action Constants (string values for flexibility)
 */
export const AUDIT_LOG_ACTIONS = {
  // User actions
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_BLOCKED: 'USER_BLOCKED',
  USER_UNBLOCKED: 'USER_UNBLOCKED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
  USER_PROFILE_UPDATED: 'USER_PROFILE_UPDATED',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',

  // Role actions
  ROLE_CREATED: 'ROLE_CREATED',
  ROLE_UPDATED: 'ROLE_UPDATED',
  ROLE_DELETED: 'ROLE_DELETED',
  ROLE_ASSIGNED_TO_USER: 'ROLE_ASSIGNED_TO_USER',
  ROLE_REMOVED_FROM_USER: 'ROLE_REMOVED_FROM_USER',

  // Permission actions
  PERMISSION_CREATED: 'PERMISSION_CREATED',
  PERMISSION_UPDATED: 'PERMISSION_UPDATED',
  PERMISSION_DELETED: 'PERMISSION_DELETED',
  PERMISSION_ASSIGNED_TO_ROLE: 'PERMISSION_ASSIGNED_TO_ROLE',
  PERMISSION_REMOVED_FROM_ROLE: 'PERMISSION_REMOVED_FROM_ROLE',
  PERMISSIONS_SYNCED: 'PERMISSIONS_SYNCED',

  // Bulk operations
  BULK_USER_CREATED: 'BULK_USER_CREATED',
  BULK_USER_DELETED: 'BULK_USER_DELETED',
  BULK_ROLE_UPDATED: 'BULK_ROLE_UPDATED',
} as const;

export type AuditLogAction = (typeof AUDIT_LOG_ACTIONS)[keyof typeof AUDIT_LOG_ACTIONS];

/**
 * Success messages for audit logs
 */
export const AUDIT_LOG_SUCCESS = {
  LOG_CREATED: 'Audit log created successfully',
  LOGS_FETCHED: 'Audit logs fetched successfully',
  LOG_FETCHED: 'Audit log fetched successfully',
  LOGS_EXPORTED: 'Audit logs exported successfully',
} as const;

/**
 * Error messages for audit logs
 */
export const AUDIT_LOG_ERRORS = {
  LOG_NOT_FOUND: 'Audit log not found',
  FAILED_TO_CREATE_LOG: 'Failed to create audit log',
  FAILED_TO_FETCH_LOGS: 'Failed to fetch audit logs',
} as const;
