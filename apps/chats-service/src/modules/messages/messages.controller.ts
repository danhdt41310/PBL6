import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageDto, PaginationDto } from './dto/message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  /**
   * Test endpoint
   */
  @MessagePattern('messages.get_hello')
  getHello(@Payload() data: { name: string }) {
    return `Hello, ${data.name}! Welcome to the Chats Service - Messages.`;
  }

  /**
   * Create a new message
   * Pattern: messages.create
   */
  @MessagePattern('messages.create')
  async createMessage(@Payload() createMessageDto: CreateMessageDto) {
    const message = await this.messagesService.createMessage(createMessageDto);
    return {
      success: true,
      message: 'Message created successfully',
      data: message,
    };
  }

  /**
   * Get messages in a conversation with pagination
   * Pattern: messages.find_by_conversation
   */
  @MessagePattern('messages.find_by_conversation')
  async findMessages(
    @Payload() payload: { conversationId: number; pagination?: PaginationDto }
  ) {
    const { conversationId, pagination = { page: 1, limit: 20 } } = payload;
    return await this.messagesService.findMessages(conversationId, pagination);
  }

  /**
   * Get a single message by ID
   * Pattern: messages.find_one
   */
  @MessagePattern('messages.find_one')
  async findOne(@Payload() payload: { id: number }) {
    const message = await this.messagesService.findOne(payload.id);
    return {
      success: true,
      data: message,
    };
  }

  /**
   * Update a message
   * Pattern: messages.update
   */
  @MessagePattern('messages.update')
  async updateMessage(
    @Payload() payload: { id: number; data: UpdateMessageDto }
  ) {
    const message = await this.messagesService.updateMessage(payload.id, payload.data);
    return {
      success: true,
      message: 'Message updated successfully',
      data: message,
    };
  }

  /**
   * Delete a message
   * Pattern: messages.delete
   */
  @MessagePattern('messages.delete')
  async deleteMessage(@Payload() payload: { id: number }) {
    return await this.messagesService.deleteMessage(payload.id);
  }

  /**
   * Get all messages for a user
   * Pattern: messages.find_by_user
   */
  @MessagePattern('messages.find_by_user')
  async findUserMessages(
    @Payload() payload: { userId: number; pagination?: PaginationDto }
  ) {
    const { userId, pagination = { page: 1, limit: 20 } } = payload;
    return await this.messagesService.findUserMessages(userId, pagination);
  }
}
