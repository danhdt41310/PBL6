import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto, UpdateMessageDto } from './dto/message.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Message } from '@prisma/chats-client';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}
}
