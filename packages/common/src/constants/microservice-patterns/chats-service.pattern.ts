/**
 * Conversation Management Message Patterns.
 * RPC communication patterns for conversation operations.
 */
export const CONVERSATION_PATTERNS = {
  CREATE: 'chats.create_conversation',
  GET_BY_ID: 'chats.get_conversation',
  GET_BY_USER: 'chats.get_user_conversations',
  GET_OR_CREATE: 'chats.get_or_create_conversation',
  DELETE: 'chats.delete_conversation',
  UPDATE_LAST_MESSAGE: 'chats.update_last_message',
} as const;

export type ConversationMessagePattern = (typeof CONVERSATION_PATTERNS)[keyof typeof CONVERSATION_PATTERNS];

/**
 * Message Management Message Patterns.
 * RPC communication patterns for message operations.
 */
export const MESSAGE_PATTERNS = {
  CREATE: 'chats.create_message',
  GET_BY_CONVERSATION: 'chats.get_messages',
  MARK_READ: 'chats.mark_messages_read',
  DELETE: 'chats.delete_message',
  GET_UNREAD_COUNT: 'chats.get_unread_count',
} as const;

export type ChatMessagePattern = (typeof MESSAGE_PATTERNS)[keyof typeof MESSAGE_PATTERNS];
