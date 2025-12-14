import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Message, MessageType } from '@prisma/chats-client';

/**
 * Message Repository
 * Extends BaseRepository with message-specific operations
 */
@Injectable()
export class MessageRepository extends BaseRepository<Message> {
  constructor(prisma: PrismaService) {
    super(prisma, 'message');
  }

  /**
   * Find messages by conversation ID
   * @param conversationId - Conversation ID
   * @returns Array of messages in the conversation
   */
  async findByConversationId(conversationId: number): Promise<Message[]> {
    return await this.findMany({
      conversation_id: conversationId,
    });
  }

  /**
   * Find messages by conversation ID with pagination and sorting
   * @param conversationId - Conversation ID
   * @param options - Query options (pagination, sorting)
   * @returns Paginated array of messages
   */
  async findByConversationIdPaginated(
    conversationId: number,
    options?: {
      page?: number;
      limit?: number;
      orderBy?: 'asc' | 'desc';
    },
  ): Promise<{
    messages: Message[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, orderBy = 'desc' } = options || {};
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.model.findMany({
        where: { conversation_id: conversationId },
        orderBy: { timestamp: orderBy },
        skip,
        take: limit,
        include: {
          conversation: true,
        },
      }),
      this.count({ conversation_id: conversationId }),
    ]);

    return {
      messages,
      total,
      page,
      limit,
    };
  }

  /**
   * Find unread messages for a user in a conversation
   * @param conversationId - Conversation ID
   * @param userId - User ID (receiver)
   * @returns Array of unread messages
   */
  async findUnreadMessages(
    conversationId: number,
    userId: number,
  ): Promise<Message[]> {
    return await this.findMany({
      conversation_id: conversationId,
      is_read: false,
      sender_id: { not: userId }, // Messages sent by others
    });
  }

  /**
   * Count unread messages for a user
   * @param userId - User ID (receiver)
   * @returns Count of unread messages
   */
  async countUnreadByUserId(userId: number): Promise<number> {
    // Get all conversations involving this user
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ sender_id: userId }, { receiver_id: userId }],
      },
      select: { id: true },
    });

    const conversationIds = conversations.map((c) => c.id);

    // Count unread messages in these conversations where user is NOT the sender
    return await this.count({
      conversation_id: { in: conversationIds },
      is_read: false,
      sender_id: { not: userId },
    });
  }

  /**
   * Mark messages as read
   * @param messageIds - Array of message IDs to mark as read
   */
  async markAsRead(messageIds: number[]): Promise<void> {
    await this.model.updateMany({
      where: {
        id: { in: messageIds },
      },
      data: {
        is_read: true,
      },
    });
  }

  /**
   * Mark all messages in a conversation as read for a user
   * @param conversationId - Conversation ID
   * @param userId - User ID (receiver)
   */
  async markConversationAsRead(
    conversationId: number,
    userId: number,
  ): Promise<void> {
    await this.model.updateMany({
      where: {
        conversation_id: conversationId,
        sender_id: { not: userId }, // Only mark messages from others
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });
  }

  /**
   * Find messages by sender ID
   * @param senderId - Sender user ID
   * @returns Array of messages sent by the user
   */
  async findBySenderId(senderId: number): Promise<Message[]> {
    return await this.findMany({
      sender_id: senderId,
    });
  }

  /**
   * Find messages by type
   * @param conversationId - Conversation ID
   * @param messageType - Type of message (text, file, image)
   * @returns Array of messages of specified type
   */
  async findByType(
    conversationId: number,
    messageType: MessageType,
  ): Promise<Message[]> {
    return await this.findMany({
      conversation_id: conversationId,
      message_type: messageType,
    });
  }

  /**
   * Get latest message in a conversation
   * @param conversationId - Conversation ID
   * @returns Latest message or null
   */
  async getLatestMessage(conversationId: number): Promise<Message | null> {
    return await this.model.findFirst({
      where: { conversation_id: conversationId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Delete all messages in a conversation
   * @param conversationId - Conversation ID
   */
  async deleteByConversationId(conversationId: number): Promise<void> {
    await this.model.deleteMany({
      where: { conversation_id: conversationId },
    });
  }

  /**
   * Create message with conversation relation
   * @param data - Message data including conversation_id
   * @returns Created message with conversation
   */
  async createWithConversation(data: Partial<Message>): Promise<Message> {
    return await this.model.create({
      data,
      include: {
        conversation: true,
      },
    });
  }
}
