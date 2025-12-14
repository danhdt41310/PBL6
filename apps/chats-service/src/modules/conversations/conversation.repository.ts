import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Conversation, Prisma } from '@prisma/chats-client';

/**
 * Conversation Repository
 * Extends BaseRepository with conversation-specific operations
 */
@Injectable()
export class ConversationRepository extends BaseRepository<Conversation> {
  constructor(prisma: PrismaService) {
    super(prisma, 'conversation');
  }

  /**
   * Find conversations by user ID
   * Returns conversations where user is either sender or receiver
   * @param userId - User ID to search for
   * @returns Array of conversations involving the user
   */
  async findByUserId(userId: number): Promise<Conversation[]> {
    return await this.findMany({
      OR: [{ sender_id: userId }, { receiver_id: userId }],
    });
  }

  /**
   * Find conversation between two users (bidirectional)
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @returns Conversation if found, null otherwise
   */
  async findByUsers(
    userId1: number,
    userId2: number,
  ): Promise<Conversation | null> {
    return await this.findFirst({
      OR: [
        {
          sender_id: userId1,
          receiver_id: userId2,
        },
        {
          sender_id: userId2,
          receiver_id: userId1,
        },
      ],
    });
  }

  /**
   * Find conversations with messages included
   * @param userId - User ID
   * @param options - Query options (pagination, sorting)
   * @returns Conversations with messages
   */
  async findByUserIdWithMessages(
    userId: number,
    options?: {
      page?: number;
      limit?: number;
      orderBy?: 'asc' | 'desc';
    },
  ): Promise<Conversation[]> {
    const { page = 1, limit = 20, orderBy = 'desc' } = options || {};
    const skip = (page - 1) * limit;

    return await this.model.findMany({
      where: {
        OR: [{ sender_id: userId }, { receiver_id: userId }],
      },
      include: {
        messages: {
          orderBy: { timestamp: orderBy },
          take: 1, // Only latest message for preview
        },
      },
      skip,
      take: limit,
      orderBy: {
        id: orderBy,
      },
    });
  }

  /**
   * Find conversation by ID with messages
   * @param id - Conversation ID
   * @param includeAllMessages - Whether to include all messages or just the latest
   * @returns Conversation with messages
   */
  async findByIdWithMessages(
    id: number,
    includeAllMessages: boolean = false,
  ): Promise<Conversation | null> {
    return await this.model.findUnique({
      where: { id },
      include: {
        messages: includeAllMessages
          ? {
              orderBy: { timestamp: 'desc' },
            }
          : {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
      },
    });
  }

  /**
   * Count conversations for a user
   * @param userId - User ID
   * @returns Count of conversations
   */
  async countByUserId(userId: number): Promise<number> {
    return await this.count({
      OR: [{ sender_id: userId }, { receiver_id: userId }],
    });
  }

  /**
   * Create conversation with validation
   * Prevents duplicate conversations between same users
   * @param senderId - Sender user ID
   * @param receiverId - Receiver user ID
   * @returns Created or existing conversation
   */
  async createUnique(
    senderId: number,
    receiverId: number,
  ): Promise<Conversation> {
    // Check if conversation already exists
    const existing = await this.findByUsers(senderId, receiverId);
    if (existing) {
      return existing;
    }

    // Create new conversation
    return await this.create({
      sender_id: senderId,
      receiver_id: receiverId,
    } as Partial<Conversation>);
  }
}
