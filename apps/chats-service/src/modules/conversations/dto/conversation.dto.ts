import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
// Lưu ý: PartialType phải được import từ '@nestjs/swagger' hoặc '@nestjs/mapped-types'
// Vì bạn yêu cầu loại bỏ Swagger, tôi giả định PartialType sẽ đến từ '@nestjs/mapped-types'
// hoặc bạn sẽ tự định nghĩa nó, nhưng để giữ tính toàn vẹn của logic, tôi đã bỏ qua nó.

// **********************************************
// ********** Conversation DTOs (Sửa) ***********
// **********************************************

/**
 * DTO for creating a new conversation
 */
export class CreateConversationDto {
  @IsInt()
  @IsNotEmpty()
  sender_id: number;

  @IsInt()
  @IsNotEmpty()
  receiver_id: number;
}

/**
 * DTO for updating a conversation (minimal - conversations rarely update)
 * (Cần import PartialType từ '@nestjs/mapped-types' nếu không dùng Swagger)
 */
// export class UpdateConversationDto extends PartialType(CreateConversationDto) { }
// Để tránh lỗi import, tôi định nghĩa lại thủ công:
export class UpdateConversationDto {
  @IsInt()
  @IsOptional()
  sender_id?: number;

  @IsInt()
  @IsOptional()
  receiver_id?: number;
}

/**
 * DTO for pagination
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
// ********** Response DTOs (Sửa) ***************
// **********************************************

/**
 * Message DTO for conversation responses
 */
export interface MessageDto {
  id: number;
  sender_id: number;
  conversation_id: number;
  timestamp: Date;
  message_type: string;
  content?: string;
}

/**
 * Response DTO for a single conversation with messages
 */
export interface ConversationResponseDto {
  id: number;
  sender_id: number;
  receiver_id: number;
  receiver_name?: string; // Name of the other user
  receiver_avatar?: string; // Avatar of the other user
  unread_count?: number; // Number of unread messages
  messages?: MessageDto[];
  lastMessage?: Omit<MessageDto, 'conversation_id'>; // Use Omit to clean up
  last_message?: Omit<MessageDto, 'conversation_id'>; // Alternative naming for frontend
  messageCount?: number;
}

/**
 * Response DTO for conversation list with pagination
 */
export interface ConversationListResponseDto {
  success: boolean;
  conversations: ConversationResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Response DTO for conversation actions
 */
export interface ConversationActionResponseDto {
  success: boolean;
  message: string;
  data?: ConversationResponseDto;
}

/**
 * Response DTO for hello endpoint
 */
export interface ConversationHelloResponseDto {
  message: string;
}

/**
 * Response DTO for create conversation
 */
export interface CreateConversationResponseDto {
  success: boolean;
  message: string;
  data: ConversationResponseDto;
}

/**
 * Response DTO for find one conversation
 */
export interface FindOneConversationResponseDto {
  success: boolean;
  data: ConversationResponseDto;
}

/**
 * Response DTO for find conversation by users
 */
export interface FindByUsersResponseDto {
  success: boolean;
  data: ConversationResponseDto | null;
}

/**
 * Response DTO for delete conversation
 */
export interface DeleteConversationResponseDto {
  success: boolean;
  message: string;
}

/**
 * Response DTO for conversation stats
 */
export interface ConversationStatsResponseDto {
  success: boolean;
  userId: number;
  totalConversations: number;
  totalMessages: number;
}
