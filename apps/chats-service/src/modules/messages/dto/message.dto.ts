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

// Định nghĩa kiểu cho chi tiết Conversation bên trong MessageResponseDto
interface ConversationDetails {
  id: number;
  sender_id: number;
  receiver_id: number;
}

/**
 * Response DTO for a single message with conversation details
 */
export class MessageResponseDto {
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
export class MessageListResponseDto {
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
export class MessageActionResponseDto {
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
