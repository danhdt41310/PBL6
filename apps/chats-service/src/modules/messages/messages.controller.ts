import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageDto } from './dto/message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @MessagePattern('get_messages_hello')
  getHello(@Payload() data: { name: string }) {
    return `Hello, ${data.name}! Welcome to the Chats Service - Messages.`;
  }
}
