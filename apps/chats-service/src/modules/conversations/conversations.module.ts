import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationRepository } from './conversation.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationRepository, PrismaService],
  exports: [ConversationsService, ConversationRepository],
})
export class ConversationsModule {}
