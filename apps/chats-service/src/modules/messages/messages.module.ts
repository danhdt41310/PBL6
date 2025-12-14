import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessageRepository } from './message.repository';
import { ConversationRepository } from '../conversations/conversation.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    MessageRepository,
    ConversationRepository,
    PrismaService,
  ],
  exports: [MessagesService, MessageRepository],
})
export class MessagesModule {}
