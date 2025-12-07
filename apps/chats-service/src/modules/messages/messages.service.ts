import { Injectable } from '@nestjs/common';
import {
  CreateMessageDto,
  UpdateMessageDto,
  PaginationDto,
  MessageResponseDto,
  MessageListResponseDto,
  MarkMessagesAsReadDto,
} from './dto/message.dto';
import { MessageRepository } from './message.repository';
import { ConversationRepository } from '../conversations/conversation.repository';
import { Message } from '@prisma/chats-client';
import { EventsService } from '../events/events.service';
import { ResourceNotFoundException } from '../../common/exceptions';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Create a new message
   * @param data - Message creation data
   * @returns Created message with conversation details
   * @throws RpcException with BadRequestException for validation errors
   * @throws RpcException with NotFoundException if conversation doesn't exist
   */
  async createMessage(data: CreateMessageDto): Promise<MessageResponseDto> {
    // Verify conversation exists
    const conversation = await this.conversationRepository.findById(
      data.conversation_id,
    );

    if (!conversation) {
      throw new ResourceNotFoundException('Conversation', data.conversation_id);
    }

    // Create message with conversation relation
    const message = await this.messageRepository.createWithConversation({
      sender_id: data.sender_id,
      conversation_id: data.conversation_id,
      message_type: data.message_type,
      content: data.content,
      ...(data.file_url && { file_url: data.file_url }),
      ...(data.file_name && { file_name: data.file_name }),
      ...(data.file_size && { file_size: data.file_size }),
    } as any);

    const messageDto = this.mapToResponseDto(message);

    // Emit real-time event
    await this.eventsService.emitMessageCreated(
      data.conversation_id,
      messageDto,
    );

    return messageDto;
  }

  /**
   * Find messages in a conversation with pagination
   * @param conversationId - ID of the conversation
   * @param pagination - Pagination parameters
   * @returns Paginated list of messages
   * @throws RpcException with NotFoundException if conversation doesn't exist
   */
  async findMessages(
    conversationId: number,
    pagination: PaginationDto,
  ): Promise<MessageListResponseDto> {
    const { page = 1, limit = 20 } = pagination;

    // Verify conversation exists
    const conversation =
      await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new ResourceNotFoundException('Conversation', conversationId);
    }

    // Get paginated messages
    const result = await this.messageRepository.findByConversationIdPaginated(
      conversationId,
      { page, limit, orderBy: 'desc' },
    );

    return {
      success: true,
      messages: result.messages.map((msg) => this.mapToResponseDto(msg)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }

  /**
   * Find a single message by ID
   * @param id - Message ID
   * @returns Message with conversation details
   * @throws RpcException with NotFoundException if message doesn't exist
   */
  async findOne(id: number): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(id);

    if (!message) {
      throw new ResourceNotFoundException('Message', id);
    }

    // Get conversation details separately
    const conversation = await this.conversationRepository.findById(
      message.conversation_id,
    );

    return this.mapToResponseDto({
      ...message,
      conversation,
    });
  }

  /**
   * Update a message
   * @param id - Message ID
   * @param data - Update data
   * @returns Updated message
   * @throws RpcException with NotFoundException if message doesn't exist
   */
  async updateMessage(
    id: number,
    data: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    // Check if message exists
    const existingMessage = await this.messageRepository.findById(id);

    if (!existingMessage) {
      throw new ResourceNotFoundException('Message', id);
    }

    // Update message
    const message = await this.messageRepository.update(id, {
      message_type: data.message_type,
      content: data.content,
    });

    const messageDto = this.mapToResponseDto(message);

    // Emit real-time event
    await this.eventsService.emitMessageUpdated(
      existingMessage.conversation_id,
      messageDto,
    );

    return messageDto;
  }

  /**
   * Delete a message
   * @param id - Message ID
   * @returns Success status
   * @throws RpcException with NotFoundException if message doesn't exist
   */
  async deleteMessage(
    id: number,
  ): Promise<{ success: boolean; message: string }> {
    // Check if message exists
    const existingMessage = await this.messageRepository.findById(id);

    if (!existingMessage) {
      throw new ResourceNotFoundException('Message', id);
    }

    const conversationId = existingMessage.conversation_id;

    // Delete message
    await this.messageRepository.delete(id);

    // Emit real-time event
    await this.eventsService.emitMessageDeleted(conversationId, id);

    return {
      success: true,
      message: `Message with ID ${id} deleted successfully`,
    };
  }

  /**
   * Get all messages for a specific user (as sender or receiver)
   * @param userId - User ID
   * @param pagination - Pagination parameters
   * @returns Paginated list of messages
   */
  async findUserMessages(
    userId: number,
    pagination: PaginationDto,
  ): Promise<MessageListResponseDto> {
    const { page = 1, limit = 20 } = pagination;

    // Get user's conversations
    const conversations =
      await this.conversationRepository.findByUserId(userId);
    const conversationIds = conversations.map((c) => c.id);

    // Get messages from these conversations
    const allMessages: Message[] = [];
    for (const convId of conversationIds) {
      const messages =
        await this.messageRepository.findByConversationId(convId);
      allMessages.push(...messages);
    }

    // Sort by timestamp desc
    allMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Paginate
    const total = allMessages.length;
    const startIndex = (page - 1) * limit;
    const paginatedMessages = allMessages.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      messages: paginatedMessages.map((msg) => this.mapToResponseDto(msg)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Mark messages as read
   * @param data - Mark as read data
   * @returns Number of messages marked as read
   */
  async markMessagesAsRead(
    data: MarkMessagesAsReadDto,
  ): Promise<{ success: boolean; count: number }> {
    // Verify conversation exists
    const conversation = await this.conversationRepository.findById(
      data.conversation_id,
    );

    if (!conversation) {
      throw new ResourceNotFoundException('Conversation', data.conversation_id);
    }

    let count = 0;

    // If specific message IDs provided
    if (data.message_ids && data.message_ids.length > 0) {
      await this.messageRepository.markAsRead(data.message_ids);
      count = data.message_ids.length;
    } else {
      // Mark all unread messages in conversation
      const unreadMessages = await this.messageRepository.findUnreadMessages(
        data.conversation_id,
        data.user_id,
      );

      if (unreadMessages.length > 0) {
        await this.messageRepository.markAsRead(
          unreadMessages.map((m) => m.id),
        );
        count = unreadMessages.length;
      }
    }

    // Emit real-time event
    await this.eventsService.emitMessagesRead(
      data.conversation_id,
      data.user_id,
      count,
    );

    return {
      success: true,
      count,
    };
  }

  /**
   * Get unread count for a user across all conversations
   * @param userId - User ID
   * @returns Total unread message count
   */
  async getUnreadCount(userId: number): Promise<{ count: number }> {
    const count = await this.messageRepository.countUnreadByUserId(userId);

    return { count };
  }

  /**
   * Get unread count per conversation for a user
   * @param userId - User ID
   * @returns Array of conversation IDs with unread counts
   */
  async getUnreadCountByConversation(
    userId: number,
  ): Promise<{ conversation_id: number; unread_count: number }[]> {
    // Get user's conversations
    const conversations =
      await this.conversationRepository.findByUserId(userId);

    const result: { conversation_id: number; unread_count: number }[] = [];

    // Count unread messages per conversation
    for (const conv of conversations) {
      const unreadMessages = await this.messageRepository.findUnreadMessages(
        conv.id,
        userId,
      );

      if (unreadMessages.length > 0) {
        result.push({
          conversation_id: conv.id,
          unread_count: unreadMessages.length,
        });
      }
    }

    return result;
  }

  /**
   * Map Prisma message to response DTO
   */
  private mapToResponseDto(message: any): MessageResponseDto {
    return {
      id: message.id,
      sender_id: message.sender_id,
      conversation_id: message.conversation_id,
      timestamp: message.timestamp,
      message_type: message.message_type,
      content: message.content,
      is_read: message.is_read ?? false,
      file_url: message.file_url,
      file_name: message.file_name,
      file_size: message.file_size,
      conversation: message.conversation
        ? {
            id: message.conversation.id,
            sender_id: message.conversation.sender_id,
            receiver_id: message.conversation.receiver_id,
          }
        : undefined,
    };
  }
}
