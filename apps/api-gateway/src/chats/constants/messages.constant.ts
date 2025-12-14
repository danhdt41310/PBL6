/**
 * Socket Event Messages Constants
 */
export const SOCKET_MESSAGES = {
  // Connection messages
  CONNECTION: {
    USER_CONNECTED: 'User connected',
    USER_DISCONNECTED: 'User disconnected (all sockets closed)',
    CONNECTION_WITHOUT_USER_ID: 'Connection attempt without userId',
    CONNECTION_ERROR: 'Error handling connection',
    DISCONNECT_ERROR: 'Error handling disconnect',
  },

  // Presence messages
  PRESENCE: {
    MARKED_ONLINE: 'User marked as online',
    MARKED_OFFLINE: 'User marked as offline',
    STATUS_UPDATED: 'User status updated to',
    PRESENCE_REMOVED: 'User presence removed',
    UPDATE_ERROR: 'Error updating presence',
    REQUEST_ERROR: 'Error requesting presence',
  },

  // Conversation messages
  CONVERSATION: {
    NOT_FOUND: 'Conversation not found',
    UNAUTHORIZED: 'Unauthorized to join this conversation',
    JOIN_ERROR: 'Error joining conversation',
  },

  // Message messages
  MESSAGE: {
    UNAUTHORIZED_SEND: 'Unauthorized',
    NOT_PARTICIPANT: 'Not a participant',
    BROADCASTED: 'Broadcasted to room',
    SEND_ERROR: 'Error sending message',
    INVALID_MESSAGE_ID: 'Invalid message_id',
    NOT_FOUND: 'Message not found',
    DELIVERED_ERROR: 'Error handling message delivered',
    READ_ERROR: 'Error handling message read',
  },

  // Class messages
  CLASS: {
    JOIN_FAILED: 'Failed to join class',
    JOIN_ERROR: 'Error joining class',
    JOIN_ERROR_CODE: 'JOIN_CLASS_ERROR',
  },

  // Gateway messages
  GATEWAY: {
    INITIALIZED: 'WebSocket server initialized',
  },
} as const;

/**
 * Log Prefixes for better debugging
 */
export const LOG_PREFIX = {
  CONNECTION: '🔌',
  DISCONNECT: '❌',
  PRESENCE: '👤',
  CONVERSATION: '💬',
  MESSAGE: '📨',
  CLASS: '🏫',
  ERROR: '⚠️',
  SUCCESS: '✅',
} as const;
