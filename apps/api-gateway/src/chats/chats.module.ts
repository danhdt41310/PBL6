import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { PresenceService } from './services/presence.service';
import { ConnectionSocketService } from './services/connection-socket.service';
import { ConversationSocketService } from './services/conversation-socket.service';
import { MessageSocketService } from './services/message-socket.service';
import { ClassSocketService } from './services/class-socket.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CHATS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      },
      {
        name: 'USERS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      },
    ]),
  ],
  controllers: [ChatsController],
  providers: [
    ChatsGateway,
    PresenceService,
    ConnectionSocketService,
    ConversationSocketService,
    MessageSocketService,
    ClassSocketService,
  ],
  exports: [ChatsGateway, PresenceService],
})
export class ChatsModule {}
