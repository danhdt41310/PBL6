import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateConversationDto, UpdateConversationDto } from './dto/conversation.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Conversation } from '@prisma/chats-client';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}
}
