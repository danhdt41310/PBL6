import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto, UpdateConversationDto } from './dto/conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @MessagePattern('get_conversations_hello')
  getHello(@Payload() data: { name: string }) {
    return `Hello, ${data.name}! Welcome to the Chats Service - Conversations.`;
  }
}
