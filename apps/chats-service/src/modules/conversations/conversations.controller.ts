import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConversationsService } from './conversations.service';
import {
  CreateConversationDto,
  PaginationDto,
  ConversationHelloResponseDto,
  CreateConversationResponseDto,
  FindOneConversationResponseDto,
  FindByUsersResponseDto,
  ConversationListResponseDto,
  DeleteConversationResponseDto,
  ConversationStatsResponseDto,
} from './dto/conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  /**
   * Test endpoint
   */
  @MessagePattern('conversations.get_hello')
  getHello(@Payload() data: { name: string }): string {
    return `Hello, ${data.name}! Welcome to the Chats Service - Conversations.`;
  }

  /**
   * Create a new conversation
   * Pattern: conversations.create
   */
  @MessagePattern('conversations.create')
  async createConversation(
    @Payload() createConversationDto: CreateConversationDto,
  ): Promise<CreateConversationResponseDto> {
    console.log('Creating conversation with data:', createConversationDto);
    const conversation = await this.conversationsService.createConversation(
      createConversationDto,
    );
    return {
      success: true,
      message: 'Conversation created successfully',
      data: conversation,
    };
  }

  /**
   * Get a conversation by ID
   * Pattern: conversations.find_one
   */
  @MessagePattern('conversations.find_one')
  async findOne(
    @Payload() payload: { id: number; includeMessages?: boolean },
  ): Promise<FindOneConversationResponseDto> {
    const conversation = await this.conversationsService.findOne(
      payload.id,
      payload.includeMessages || false,
    );
    return {
      success: true,
      data: conversation,
    };
  }

  /**
   * Find conversation between two users
   * Pattern: conversations.find_by_users
   */
  @MessagePattern('conversations.find_by_users')
  async findByUsers(
    @Payload() payload: { userId1: number; userId2: number },
  ): Promise<FindByUsersResponseDto> {
    const conversation = await this.conversationsService.findByUsers(
      payload.userId1,
      payload.userId2,
    );
    return {
      success: true,
      data: conversation,
    };
  }

  /**
   * Get all conversations for a user
   * Pattern: conversations.find_by_user
   */
  @MessagePattern('conversations.find_by_user')
  async findUserConversations(
    @Payload() payload: { userId: number; pagination?: PaginationDto },
  ): Promise<ConversationListResponseDto> {
    const { userId, pagination = { page: 1, limit: 20 } } = payload;
    return await this.conversationsService.findUserConversations(
      userId,
      pagination,
    );
  }

  /**
   * Delete a conversation
   * Pattern: conversations.delete
   */
  @MessagePattern('conversations.delete')
  async deleteConversation(
    @Payload() payload: { id: number },
  ): Promise<DeleteConversationResponseDto> {
    return await this.conversationsService.deleteConversation(payload.id);
  }

  /**
   * Get conversation statistics for a user
   * Pattern: conversations.stats
   */
  @MessagePattern('conversations.stats')
  async getUserStats(
    @Payload() payload: { userId: number },
  ): Promise<ConversationStatsResponseDto> {
    return await this.conversationsService.getUserConversationStats(
      payload.userId,
    );
  }
}
