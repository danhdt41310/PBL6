/**
 * Microservice Message Patterns Constants
 * Defines all message patterns used for inter-service communication
 */

/**
 * Chats Service Patterns
 */
export const CHATS_PATTERNS = {
  // Test
  GET_HELLO: 'chats.get_hello',

  // Messages
  MESSAGES: {
    CREATE: 'messages.create',
    FIND_ONE: 'messages.find_one',
    FIND_BY_CONVERSATION: 'messages.find_by_conversation',
    UPDATE: 'messages.update',
    DELETE: 'messages.delete',
    MARK_AS_READ: 'messages.mark_as_read',
    GET_UNREAD_COUNT: 'messages.get_unread_count',
    GET_UNREAD_BY_CONVERSATION: 'messages.get_unread_by_conversation',
  },

  // Conversations
  CONVERSATIONS: {
    CREATE: 'conversations.create',
    FIND_ONE: 'conversations.find_one',
    FIND_BY_USER: 'conversations.find_by_user',
    FIND_BY_USERS: 'conversations.find_by_users',
    DELETE: 'conversations.delete',
  },
} as const;

/**
 * Users Service Patterns
 */
export const USERS_PATTERNS = {
  GET_LIST_PROFILE_BY_IDS: 'users.get_list_profile_by_ids',
} as const;

/**
 * Socket Event Patterns (for emit events)
 */
export const SOCKET_EVENT_PATTERNS = {
  MESSAGES_READ: 'messages:read',
} as const;
