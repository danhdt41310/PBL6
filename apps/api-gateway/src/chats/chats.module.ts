import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { PresenceService } from './services/presence.service';
import { Redis } from 'ioredis';

/**
 * Redis Client Provider
 */
const redisClientProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    const client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    client.on('error', (err) => {
      // Redis client error
    });

    client.on('connect', () => {
      // Redis client connected
    });

    return client;
  },
};

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
  providers: [ChatsGateway, PresenceService, redisClientProvider],
  exports: [ChatsGateway, PresenceService],
})
export class ChatsModule {}
