import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ChatsGateway } from './chats.gateway.enhanced';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { PresenceService } from './services/presence.service';
import Redis from 'ioredis';

/**
 * Redis Client Provider
 */
const redisClientProvider = {
    provide: 'REDIS_CLIENT',
    useFactory: () => {
        const redisClient = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0', 10),
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis Client Connected');
        });

        return redisClient;
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
                    port: parseInt(process.env.REDIS_PORT || '6379', 10),
                },
            },
        ]),
    ],
    controllers: [ChatsController],
    providers: [
        ChatsService,
        ChatsGateway,
        PresenceService,
        redisClientProvider,
    ],
    exports: [ChatsService, ChatsGateway],
})
export class ChatsModule { }
