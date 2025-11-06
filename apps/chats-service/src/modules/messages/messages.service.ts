import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateMessageDto, UpdateMessageDto, PaginationDto, MessageResponseDto, MessageListResponseDto } from './dto/message.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Message, Prisma } from '@prisma/chats-client';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) { }

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
          new NotFoundException(`Conversation with ID ${data.conversation_id} not found`)
        );
      }

      // Create message with conversation relation
      const message = await this.prisma.message.create({
        data: {
          sender_id: data.sender_id,
          conversation_id: data.conversation_id,
          message_type: data.message_type,
          content: data.content,
        },
        include: {
          conversation: true,
        },
      });

      return this.mapToResponseDto(message);
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
    pagination: PaginationDto
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
          new NotFoundException(`Conversation with ID ${conversationId} not found`)
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
        messages: messages.map(msg => this.mapToResponseDto(msg)),
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
          new NotFoundException(`Message with ID ${id} not found`)
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
  async updateMessage(id: number, data: UpdateMessageDto): Promise<MessageResponseDto> {
    try {
      // Check if message exists
      const existingMessage = await this.prisma.message.findUnique({
        where: { id },
      });

      if (!existingMessage) {
        throw new RpcException(
          new NotFoundException(`Message with ID ${id} not found`)
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

      return this.mapToResponseDto(message);
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
  async deleteMessage(id: number): Promise<{ success: boolean; message: string }> {
    try {
      // Check if message exists
      const existingMessage = await this.prisma.message.findUnique({
        where: { id },
      });

      if (!existingMessage) {
        throw new RpcException(
          new NotFoundException(`Message with ID ${id} not found`)
        );
      }

      // Delete message
      await this.prisma.message.delete({
        where: { id },
      });

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
    pagination: PaginationDto
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
                  OR: [
                    { sender_id: userId },
                    { receiver_id: userId },
                  ],
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
                  OR: [
                    { sender_id: userId },
                    { receiver_id: userId },
                  ],
                },
              },
            ],
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        messages: messages.map(msg => this.mapToResponseDto(msg)),
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
      conversation: message.conversation ? {
        id: message.conversation.id,
        sender_id: message.conversation.sender_id,
        receiver_id: message.conversation.receiver_id,
      } : undefined,
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
              `A record with this ${error.meta?.target} already exists`
            )
          );
        case 'P2025':
          // Record not found
          throw new RpcException(
            new NotFoundException(`Record not found during ${operation}`)
          );
        case 'P2003':
          // Foreign key constraint violation
          throw new RpcException(
            new BadRequestException(
              `Invalid reference: ${error.meta?.field_name}`
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

    // Handle other errors
    throw new RpcException(
      new InternalServerErrorException(
        `Failed to ${operation}: ${error.message}`
      )
    );
  }
}
