/**
 * Audit Logs Constants
 * Configuration values for audit logging feature
 */

export const AUDIT_LOGS_CONFIG = {
  /**
   * Maximum number of rows to export at once
   * Prevents memory overflow on large exports
   */
  MAX_EXPORT_ROWS: 10000,

  /**
   * Default page size for pagination
   */
  DEFAULT_PAGE_SIZE: 20,

  /**
   * Maximum page size allowed
   */
  MAX_PAGE_SIZE: 100,

  /**
   * Default limit for user activity history
   */
  DEFAULT_ACTIVITY_LIMIT: 50,

  /**
   * Audit log retention period in days
   * Logs older than this will be archived/deleted
   */
  RETENTION_DAYS: 90,

  /**
   * Enable/disable automatic log cleanup
   */
  AUTO_CLEANUP_ENABLED: false,
} as const;

/**
 * Audit Logs Permissions
 * Required permissions to access audit logs features
 */
export const AUDIT_LOGS_PERMISSIONS = {
  VIEW: 'audit_logs.view',
  EXPORT: 'audit_logs.export',
  VIEW_USER_ACTIVITY: 'audit_logs.view_user_activity',
  DELETE: 'audit_logs.delete', // For cleanup/archival
} as const;
