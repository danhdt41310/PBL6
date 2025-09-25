import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, PrismaService],
  exports: [MessagesService],
})
export class MessagesModule {}
