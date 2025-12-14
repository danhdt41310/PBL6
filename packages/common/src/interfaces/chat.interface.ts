/**
 * Message Type.
 */
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video';

/**
 * Message Type Values
 */
export const MESSAGE_TYPES = {
  TEXT: 'text' as MessageType,
  IMAGE: 'image' as MessageType,
  FILE: 'file' as MessageType,
  AUDIO: 'audio' as MessageType,
  VIDEO: 'video' as MessageType,
} as const;

/**
 * Message Interface
 */
export interface IMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  type?: MessageType;
  fileUrl?: string;
  fileName?: string;
  isRead?: boolean;
  readAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Create Message Input
 */
export interface ICreateMessage {
  conversationId: number;
  senderId: number;
  content: string;
  type?: MessageType;
  fileUrl?: string;
  fileName?: string;
}

/**
 * Conversation Interface
 */
export interface IConversation {
  id: number;
  senderId: number;
  receiverId: number;
  lastMessage?: IMessage;
  lastMessageId?: number;
  lastMessageAt?: Date | string;
  unreadCount?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Create Conversation Input
 */
export interface ICreateConversation {
  senderId: number;
  receiverId: number;
}
