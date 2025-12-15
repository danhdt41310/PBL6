/**
 * Audit Logs Message Patterns.
 * RPC communication patterns for audit logs in Users service.
 */
export const AUDIT_LOG_PATTERNS = {
  GET_LOGS: 'audit_logs.get_all',
  GET_LOG_BY_ID: 'audit_logs.get_by_id',
  GET_USER_ACTIVITY: 'audit_logs.get_user_activity',
  EXPORT_LOGS: 'audit_logs.export',
} as const;

export type AuditLogMessagePattern = (typeof AUDIT_LOG_PATTERNS)[keyof typeof AUDIT_LOG_PATTERNS];
