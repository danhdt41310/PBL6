import { IsString, IsNotEmpty, IsInt, IsOptional, IsIn, IsEnum } from 'class-validator';
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