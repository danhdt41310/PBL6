import { Injectable } from '@nestjs/common';
import {
  CreateConversationDto,
  PaginationDto,
  ConversationResponseDto,
  ConversationListResponseDto,
} from './dto/conversation.dto';
import { ConversationRepository } from './conversation.repository';
import {
  ResourceNotFoundException,
  InvalidOperationException,
} from '../../common/exceptions';
import { ERROR_MESSAGES } from '../../common/constants';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  /**
   * Create a new conversation or return existing one
   * Ensures unique conversation between two users (bidirectional)
   * @param data - Conversation creation data
   * @returns Created or existing conversation
   */
  async createConversation(
    data: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    // Prevent self-conversation
    if (data.sender_id === data.receiver_id) {
      throw new InvalidOperationException(
        ERROR_MESSAGES.CONVERSATION.SELF_CONVERSATION,
      );
    }

    // Use repository to create unique conversation
    const conversation = await this.conversationRepository.createUnique(
      data.sender_id,
      data.receiver_id,
    );

    // Get conversation with messages
    const conversationWithMessages =
      await this.conversationRepository.findByIdWithMessages(
        conversation.id,
        false, // Only latest message
      );

    return this.mapToResponseDto(conversationWithMessages);
  }

  /**
   * Find a conversation by ID
   * @param id - Conversation ID
   * @param includeMessages - Whether to include all messages
   * @returns Conversation with optional messages
   */
  async findOne(
    id: number,
    includeMessages: boolean = false,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findByIdWithMessages(
      id,
      includeMessages,
    );

    if (!conversation) {
      throw new ResourceNotFoundException('Conversation', id);
    }

    return this.mapToResponseDto(conversation);
  }

  /**
   * Find conversation between two users
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @returns Conversation if exists
   */
  async findByUsers(
    userId1: number,
    userId2: number,
  ): Promise<ConversationResponseDto | null> {
    const conversation = await this.conversationRepository.findByUsers(
      userId1,
      userId2,
    );

    if (!conversation) {
      return null;
    }

    // Get with messages
    const conversationWithMessages =
      await this.conversationRepository.findByIdWithMessages(
        conversation.id,
        false, // Only latest message
      );

    return conversationWithMessages
      ? this.mapToResponseDto(conversationWithMessages)
      : null;
  }

  /**
   * Get all conversations for a user with pagination
   * @param userId - User ID
   * @param pagination - Pagination parameters
   * @returns Paginated list of conversations
   */
  async findUserConversations(
    userId: number,
    pagination: PaginationDto,
  ): Promise<ConversationListResponseDto> {
    const { page = 1, limit = 20 } = pagination;

    const [conversations, total] = await Promise.all([
      this.conversationRepository.findByUserIdWithMessages(userId, {
        page,
        limit,
        orderBy: 'desc',
      }),
      this.conversationRepository.countByUserId(userId),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      conversations: conversations.map((conv) =>
        this.mapToResponseDto(conv, userId),
      ),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Delete a conversation and all its messages
   * @param id - Conversation ID
   * @returns Success status
   */
  async deleteConversation(
    id: number,
  ): Promise<{ success: boolean; message: string }> {
    const conversation = await this.conversationRepository.findById(id);

    if (!conversation) {
      throw new ResourceNotFoundException('Conversation', id);
    }

    // Delete conversation (messages will be cascade deleted due to onDelete: Cascade)
    await this.conversationRepository.delete(id);

    return {
      success: true,
      message: ERROR_MESSAGES.CONVERSATION.DELETE_FAILED.replace(
        'Failed to delete conversation',
        `Conversation with ID ${id} and all its messages deleted successfully`,
      ),
    };
  }

  /**
   * Get conversation statistics for a user
   * @param userId - User ID
   * @returns Statistics about user's conversations
   */
  async getUserConversationStats(userId: number): Promise<{
    success: boolean;
    userId: number;
    totalConversations: number;
    totalMessages: number;
  }> {
    const totalConversations =
      await this.conversationRepository.countByUserId(userId);

    // Get all conversations to count total messages
    const conversations =
      await this.conversationRepository.findByUserId(userId);
    let totalMessages = 0;

    // This could be optimized with a custom repository method if needed
    for (const conv of conversations) {
      const convWithMessages: any =
        await this.conversationRepository.findByIdWithMessages(conv.id, true);
      if (convWithMessages?.messages) {
        totalMessages += convWithMessages.messages.length;
      }
    }

    return {
      success: true,
      userId,
      totalConversations,
      totalMessages,
    };
  }

  /**
   * Map Prisma conversation to response DTO
   */
  private mapToResponseDto(
    conversation: any,
    currentUserId?: number,
  ): ConversationResponseDto {
    const response: ConversationResponseDto = {
      id: conversation.id,
      sender_id: conversation.sender_id,
      receiver_id: conversation.receiver_id,
    };

    // If currentUserId provided, determine the other user (receiver from perspective)
    if (currentUserId) {
      const otherUserId =
        conversation.sender_id === currentUserId
          ? conversation.receiver_id
          : conversation.sender_id;

      // Add receiver info (will be populated by gateway later if needed)
      response.receiver_id = otherUserId;
      response.receiver_name = `User #${otherUserId}`; // Placeholder
    }

    if (conversation.messages) {
      // If we have all messages
      if (conversation.messages.length > 1) {
        response.messages = conversation.messages.map((msg: any) => ({
          id: msg.id,
          sender_id: msg.sender_id,
          conversation_id: msg.conversation_id,
          timestamp: msg.timestamp,
          message_type: msg.message_type,
          content: msg.content,
        }));
        response.messageCount = conversation.messages.length;
      }

      // If we have at least one message (last message)
      if (conversation.messages.length > 0) {
        const lastMsg = conversation.messages[0];
        response.last_message = {
          id: lastMsg.id,
          sender_id: lastMsg.sender_id,
          timestamp: lastMsg.timestamp,
          message_type: lastMsg.message_type,
          content: lastMsg.content,
        };
      }
    }

    return response;
  }
}
