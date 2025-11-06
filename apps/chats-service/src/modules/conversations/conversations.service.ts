import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import {
  CreateConversationDto,
  UpdateConversationDto,
  PaginationDto,
  ConversationResponseDto,
  ConversationListResponseDto
} from './dto/conversation.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Conversation, Prisma } from '@prisma/chats-client';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Create a new conversation or return existing one
   * Ensures unique conversation between two users (bidirectional)
   * @param data - Conversation creation data
   * @returns Created or existing conversation
   */
  async createConversation(data: CreateConversationDto): Promise<ConversationResponseDto> {
    try {
      // Prevent self-conversation
      if (data.sender_id === data.receiver_id) {
        throw new RpcException(
          new BadRequestException('Cannot create conversation with yourself')
        );
      }

      // Check if conversation already exists (bidirectional)
      const existingConversation = await this.prisma.conversation.findFirst({
        where: {
          OR: [
            {
              sender_id: data.sender_id,
              receiver_id: data.receiver_id,
            },
            {
              sender_id: data.receiver_id,
              receiver_id: data.sender_id,
            },
          ],
        },
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });

      if (existingConversation) {
        return this.mapToResponseDto(existingConversation);
      }

      // Create new conversation
      const conversation = await this.prisma.conversation.create({
        data: {
          sender_id: data.sender_id,
          receiver_id: data.receiver_id,
        },
        include: {
          messages: true,
        },
      });

      return this.mapToResponseDto(conversation);
    } catch (error) {
      this.handlePrismaError(error, 'create conversation');
    }
  }

  /**
   * Find a conversation by ID
   * @param id - Conversation ID
   * @param includeMessages - Whether to include all messages
   * @returns Conversation with optional messages
   */
  async findOne(id: number, includeMessages: boolean = false): Promise<ConversationResponseDto> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id },
        include: {
          messages: includeMessages ? {
            orderBy: { timestamp: 'desc' },
          } : {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });

      if (!conversation) {
        throw new RpcException(
          new NotFoundException(`Conversation with ID ${id} not found`)
        );
      }

      return this.mapToResponseDto(conversation);
    } catch (error) {
      this.handlePrismaError(error, 'find conversation');
    }
  }

  /**
   * Find conversation between two users
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @returns Conversation if exists
   */
  async findByUsers(userId1: number, userId2: number): Promise<ConversationResponseDto | null> {
    try {
      const conversation = await this.prisma.conversation.findFirst({
        where: {
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
        },
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });

      return conversation ? this.mapToResponseDto(conversation) : null;
    } catch (error) {
      this.handlePrismaError(error, 'find conversation by users');
    }
  }

  /**
   * Get all conversations for a user with pagination
   * @param userId - User ID
   * @param pagination - Pagination parameters
   * @returns Paginated list of conversations
   */
  async findUserConversations(
    userId: number,
    pagination: PaginationDto
  ): Promise<ConversationListResponseDto> {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const [conversations, total] = await Promise.all([
        this.prisma.conversation.findMany({
          where: {
            OR: [
              { sender_id: userId },
              { receiver_id: userId },
            ],
          },
          skip,
          take: limit,
          include: {
            messages: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          },
          orderBy: {
            id: 'desc',
          },
        }),
        this.prisma.conversation.count({
          where: {
            OR: [
              { sender_id: userId },
              { receiver_id: userId },
            ],
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        conversations: conversations.map(conv => this.mapToResponseDto(conv)),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.handlePrismaError(error, 'find user conversations');
    }
  }

  /**
   * Delete a conversation and all its messages
   * @param id - Conversation ID
   * @returns Success status
   */
  async deleteConversation(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id },
      });

      if (!conversation) {
        throw new RpcException(
          new NotFoundException(`Conversation with ID ${id} not found`)
        );
      }

      // Delete conversation (messages will be cascade deleted due to onDelete: Cascade)
      await this.prisma.conversation.delete({
        where: { id },
      });

      return {
        success: true,
        message: `Conversation with ID ${id} and all its messages deleted successfully`,
      };
    } catch (error) {
      this.handlePrismaError(error, 'delete conversation');
    }
  }

  /**
   * Get conversation statistics for a user
   * @param userId - User ID
   * @returns Statistics about user's conversations
   */
  async getUserConversationStats(userId: number): Promise<any> {
    try {
      const [totalConversations, totalMessages] = await Promise.all([
        this.prisma.conversation.count({
          where: {
            OR: [
              { sender_id: userId },
              { receiver_id: userId },
            ],
          },
        }),
        this.prisma.message.count({
          where: {
            conversation: {
              OR: [
                { sender_id: userId },
                { receiver_id: userId },
              ],
            },
          },
        }),
      ]);

      return {
        success: true,
        userId,
        totalConversations,
        totalMessages,
      };
    } catch (error) {
      this.handlePrismaError(error, 'get conversation stats');
    }
  }

  /**
   * Map Prisma conversation to response DTO
   */
  private mapToResponseDto(conversation: any): ConversationResponseDto {
    const response: ConversationResponseDto = {
      id: conversation.id,
      sender_id: conversation.sender_id,
      receiver_id: conversation.receiver_id,
    };

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
        response.lastMessage = {
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

  /**
   * Handle Prisma errors and map to appropriate HTTP exceptions
   */
  private handlePrismaError(error: any, operation: string): never {
    if (error instanceof RpcException) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new RpcException(
            new BadRequestException(
              `Conversation already exists between these users`
            )
          );
        case 'P2025':
          throw new RpcException(
            new NotFoundException(`Record not found during ${operation}`)
          );
        case 'P2003':
          throw new RpcException(
            new BadRequestException(
              `Invalid user reference`
            )
          );
        default:
          throw new RpcException(
            new InternalServerErrorException(
              `Database error during ${operation}: ${error.code}`
            )
          );
      }
    }

    throw new RpcException(
      new InternalServerErrorException(
        `Failed to ${operation}: ${error.message}`
      )
    );
  }
}
