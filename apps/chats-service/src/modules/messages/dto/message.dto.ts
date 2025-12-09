import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsIn,
  IsEnum,
  IsArray,
} from 'class-validator';
import { MessageType } from '@prisma/chats-client';

// Re-export MessageType for convenience
export { MessageType };

// **********************************************
// ********** Message DTOs **********************
// **********************************************

/**
 * DTO for creating a new message
 */
export class CreateMessageDto {
  @IsInt()
  @IsNotEmpty()
  sender_id: number;

  @IsInt()
  @IsNotEmpty()
  conversation_id: number;

  @IsEnum(MessageType)
  @IsOptional()
  message_type?: MessageType = MessageType.text;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  is_read?: boolean = false;

  @IsString()
  @IsOptional()
  file_url?: string;

  @IsString()
  @IsOptional()
  file_name?: string;

  @IsInt()
  @IsOptional()
  file_size?: number;
}

/**
 * DTO for updating a message
 * (Đã loại bỏ PartialType và định nghĩa thủ công các trường optional)
 */
export class UpdateMessageDto {
  @IsInt()
  @IsOptional()
  sender_id?: number;

  @IsInt()
  @IsOptional()
  conversation_id?: number;

  @IsEnum(MessageType)
  @IsOptional()
  message_type?: MessageType;

  @IsString()
  @IsOptional()
  content?: string;
}

/**
 * DTO for pagination query
 * (GIỮ NGUYÊN TÊN CLASS LÀ PaginationDto)
 */
export class PaginationDto {
  @IsInt()
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @IsOptional()
  limit?: number = 20;
}

// **********************************************
// ********** Response DTOs *********************
// **********************************************

/**
 * Conversation details for message responses
 */
export interface ConversationDetails {
  id: number;
  sender_id: number;
  receiver_id: number;
}

/**
 * Response DTO for a single message with conversation details
 */
export interface MessageResponseDto {
  id: number;
  sender_id: number;
  conversation_id: number;
  timestamp: Date;
  message_type: MessageType;
  content?: string;
  is_read: boolean;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  conversation?: ConversationDetails;
}

/**
 * Response DTO for message list with pagination
 */
export interface MessageListResponseDto {
  success: boolean;
  messages: MessageResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Response DTO for single message operations
 */
export interface MessageActionResponseDto {
  success: boolean;
  message: string;
  data?: MessageResponseDto;
}

/**
 * DTO for marking messages as read
 */
export class MarkMessagesAsReadDto {
  @IsInt()
  @IsNotEmpty()
  conversation_id: number;

  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  message_ids?: number[]; // If not provided, mark all messages in conversation as read
}

// **********************************************
// ********** Controller Response DTOs **********
// **********************************************

/**
 * Response DTO for hello endpoint
 */
export interface MessageHelloResponseDto {
  message: string;
}

/**
 * Response DTO for create message
 */
export interface CreateMessageResponseDto {
  success: boolean;
  message: string;
  data: MessageResponseDto;
}

/**
 * Response DTO for find one message
 */
export interface FindOneMessageResponseDto {
  success: boolean;
  data: MessageResponseDto;
}

/**
 * Response DTO for update message
 */
export interface UpdateMessageResponseDto {
  success: boolean;
  message: string;
  data: MessageResponseDto;
}

/**
 * Response DTO for delete message
 */
export interface DeleteMessageResponseDto {
  success: boolean;
  message: string;
}

/**
 * Response DTO for mark messages as read
 */
export interface MarkMessagesAsReadResponseDto {
  success: boolean;
  count: number;
}

/**
 * Response DTO for unread count
 */
export interface UnreadCountResponseDto {
  count: number;
}

/**
 * Response DTO for unread count by conversation
 */
export interface UnreadCountByConversationItem {
  conversation_id: number;
  unread_count: number;
}

export type UnreadCountByConversationResponseDto =
  UnreadCountByConversationItem[];
