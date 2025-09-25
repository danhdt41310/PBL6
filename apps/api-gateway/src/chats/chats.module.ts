import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ChatsController } from './chats.controller';

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
    ]),
  ],
  controllers: [ChatsController],
  providers: [],
})
export class ChatsModule {}
