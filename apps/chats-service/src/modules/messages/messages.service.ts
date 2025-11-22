import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CreateMessageDto,
  UpdateMessageDto,
  PaginationDto,
  MessageResponseDto,
  MessageListResponseDto,
  MarkMessagesAsReadDto,
} from './dto/message.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Message, Prisma } from '@prisma/chats-client';
import { RpcException } from '@nestjs/microservices';
import { EventsService } from '../events/events.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
  ) {}

  /**
   * Create a new message
   * @param data - Message creation data
   * @returns Created message with conversation details
   * @throws RpcException with BadRequestException for validation errors
   * @throws RpcException with NotFoundException if conversation doesn't exist
   */
  async createMessage(data: CreateMessageDto): Promise<MessageResponseDto> {
    try {
      // Verify conversation exists
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: data.conversation_id },
      });

      if (!conversation) {
        throw new RpcException(
          new NotFoundException(
            `Conversation with ID ${data.conversation_id} not found`,
          ),
        );
      }

      // Create message with conversation relation
      const message = await this.prisma.message.create({
        data: {
          sender_id: data.sender_id,
          conversation_id: data.conversation_id,
          message_type: data.message_type,
          content: data.content,
          file_url: data.file_url,
          file_name: data.file_name,
          file_size: data.file_size,
        },
        include: {
          conversation: true,
        },
      });

      const messageDto = this.mapToResponseDto(message);

      // Emit real-time event
      await this.eventsService.emitMessageCreated(
        data.conversation_id,
        messageDto,
      );

      return messageDto;
    } catch (error) {
      this.handlePrismaError(error, 'create message');
    }
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
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      // Verify conversation exists
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new RpcException(
          new NotFoundException(
            `Conversation with ID ${conversationId} not found`,
          ),
        );
      }

      // Execute queries in parallel
      const [messages, total] = await Promise.all([
        this.prisma.message.findMany({
          where: { conversation_id: conversationId },
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' },
          include: {
            conversation: true,
          },
        }),
        this.prisma.message.count({
          where: { conversation_id: conversationId },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        messages: messages.map((msg) => this.mapToResponseDto(msg)),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.handlePrismaError(error, 'find messages');
    }
  }

  /**
   * Find a single message by ID
   * @param id - Message ID
   * @returns Message with conversation details
   * @throws RpcException with NotFoundException if message doesn't exist
   */
  async findOne(id: number): Promise<MessageResponseDto> {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id },
        include: {
          conversation: true,
        },
      });

      if (!message) {
        throw new RpcException(
          new NotFoundException(`Message with ID ${id} not found`),
        );
      }

      return this.mapToResponseDto(message);
    } catch (error) {
      this.handlePrismaError(error, 'find message');
    }
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
    try {
      // Check if message exists
      const existingMessage = await this.prisma.message.findUnique({
        where: { id },
      });

      if (!existingMessage) {
        throw new RpcException(
          new NotFoundException(`Message with ID ${id} not found`),
        );
      }

      // Update message
      const message = await this.prisma.message.update({
        where: { id },
        data: {
          message_type: data.message_type,
          content: data.content,
        },
        include: {
          conversation: true,
        },
      });

      const messageDto = this.mapToResponseDto(message);

      // Emit real-time event
      await this.eventsService.emitMessageUpdated(
        existingMessage.conversation_id,
        messageDto,
      );

      return messageDto;
    } catch (error) {
      this.handlePrismaError(error, 'update message');
    }
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
    try {
      // Check if message exists
      const existingMessage = await this.prisma.message.findUnique({
        where: { id },
      });

      if (!existingMessage) {
        throw new RpcException(
          new NotFoundException(`Message with ID ${id} not found`),
        );
      }

      const conversationId = existingMessage.conversation_id;

      // Delete message
      await this.prisma.message.delete({
        where: { id },
      });

      // Emit real-time event
      await this.eventsService.emitMessageDeleted(conversationId, id);

      return {
        success: true,
        message: `Message with ID ${id} deleted successfully`,
      };
    } catch (error) {
      this.handlePrismaError(error, 'delete message');
    }
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
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      // Find messages where user is sender OR in conversations where user is sender/receiver
      const [messages, total] = await Promise.all([
        this.prisma.message.findMany({
          where: {
            OR: [
              { sender_id: userId },
              {
                conversation: {
                  OR: [{ sender_id: userId }, { receiver_id: userId }],
                },
              },
            ],
          },
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' },
          include: {
            conversation: true,
          },
        }),
        this.prisma.message.count({
          where: {
            OR: [
              { sender_id: userId },
              {
                conversation: {
                  OR: [{ sender_id: userId }, { receiver_id: userId }],
                },
              },
            ],
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        messages: messages.map((msg) => this.mapToResponseDto(msg)),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.handlePrismaError(error, 'find user messages');
    }
  }

  /**
   * Mark messages as read
   * @param data - Mark as read data
   * @returns Number of messages marked as read
   */
  async markMessagesAsRead(
    data: MarkMessagesAsReadDto,
  ): Promise<{ success: boolean; count: number }> {
    try {
      // Verify conversation exists
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: data.conversation_id },
      });

      if (!conversation) {
        throw new RpcException(
          new NotFoundException(
            `Conversation with ID ${data.conversation_id} not found`,
          ),
        );
      }

      // Build where clause
      const whereClause: Prisma.MessageWhereInput = {
        conversation_id: data.conversation_id,
        sender_id: { not: data.user_id }, // Only mark messages from other user as read
        is_read: false,
      };

      // If specific message IDs provided, add to where clause
      if (data.message_ids && data.message_ids.length > 0) {
        whereClause.id = { in: data.message_ids };
      }

      // Update messages
      const result = await this.prisma.message.updateMany({
        where: whereClause,
        data: { is_read: true },
      });

      // Emit real-time event
      await this.eventsService.emitMessagesRead(
        data.conversation_id,
        data.user_id,
        result.count,
      );

      return {
        success: true,
        count: result.count,
      };
    } catch (error) {
      this.handlePrismaError(error, 'mark messages as read');
    }
  }

  /**
   * Get unread count for a user across all conversations
   * @param userId - User ID
   * @returns Total unread message count
   */
  async getUnreadCount(userId: number): Promise<{ count: number }> {
    try {
      const count = await this.prisma.message.count({
        where: {
          conversation: {
            OR: [{ sender_id: userId }, { receiver_id: userId }],
          },
          sender_id: { not: userId }, // Only count messages from others
          is_read: false,
        },
      });

      return { count };
    } catch (error) {
      this.handlePrismaError(error, 'get unread count');
    }
  }

  /**
   * Get unread count per conversation for a user
   * @param userId - User ID
   * @returns Array of conversation IDs with unread counts
   */
  async getUnreadCountByConversation(
    userId: number,
  ): Promise<{ conversation_id: number; unread_count: number }[]> {
    try {
      const result = await this.prisma.message.groupBy({
        by: ['conversation_id'],
        where: {
          conversation: {
            OR: [{ sender_id: userId }, { receiver_id: userId }],
          },
          sender_id: { not: userId },
          is_read: false,
        },
        _count: {
          id: true,
        },
      });

      return result.map((item) => ({
        conversation_id: item.conversation_id,
        unread_count: item._count.id,
      }));
    } catch (error) {
      this.handlePrismaError(error, 'get unread count by conversation');
    }
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

  /**
   * Handle Prisma errors and map to appropriate HTTP exceptions
   * @param error - Error object
   * @param operation - Operation being performed
   */
  private handlePrismaError(error: any, operation: string): never {
    // If it's already an RpcException, re-throw it
    if (error instanceof RpcException) {
      throw error;
    }

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          // Unique constraint violation
          throw new RpcException(
            new BadRequestException(
              `A record with this ${error.meta?.target} already exists`,
            ),
          );
        case 'P2025':
          // Record not found
          throw new RpcException(
            new NotFoundException(`Record not found during ${operation}`),
          );
        case 'P2003':
          // Foreign key constraint violation
          throw new RpcException(
            new BadRequestException(
              `Invalid reference: ${error.meta?.field_name}`,
            ),
          );
        default:
          throw new RpcException(
            new InternalServerErrorException(
              `Database error during ${operation}: ${error.code}`,
            ),
          );
      }
    }

    // Handle other errors
    throw new RpcException(
      new InternalServerErrorException(
        `Failed to ${operation}: ${error.message}`,
      ),
    );
  }
}
