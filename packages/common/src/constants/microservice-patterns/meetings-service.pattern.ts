/**
 * Meeting Management Message Patterns.
 * RPC communication patterns for meeting operations.
 */
export const MEETING_PATTERNS = {
  CREATE: 'meetings.create',
  GET_BY_ID: 'meetings.get_by_id',
  GET_ALL: 'meetings.get_all',
  UPDATE: 'meetings.update',
  DELETE: 'meetings.delete',
  JOIN: 'meetings.join',
  LEAVE: 'meetings.leave',
} as const;

export type MeetingMessagePattern = (typeof MEETING_PATTERNS)[keyof typeof MEETING_PATTERNS];
