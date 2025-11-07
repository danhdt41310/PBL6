import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

/**
 * Custom Socket.IO adapter with Redis support for horizontal scaling
 * Extends NestJS IoAdapter to integrate Redis pub/sub for cross-server communication
 */
export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>;
    private readonly logger = new Logger(RedisIoAdapter.name);

    constructor(
        app: INestApplicationContext,
        private readonly redisClient: Redis,
    ) {
        super(app);
    }

    /**
     * Initialize Redis adapter with pub/sub clients
     */
    async connectToRedis(): Promise<void> {
        try {
            // Use existing connected Redis client as pub client
            const pubClient = this.redisClient;

            // Create duplicate for sub client (will auto-connect)
            const subClient = pubClient.duplicate();

            // Wait for both clients to be ready
            await Promise.all([
                new Promise<void>((resolve) => {
                    if (pubClient.status === 'ready') {
                        resolve();
                    } else {
                        pubClient.once('ready', () => resolve());
                    }
                }),
                new Promise<void>((resolve) => {
                    if (subClient.status === 'ready') {
                        resolve();
                    } else {
                        subClient.once('ready', () => resolve());
                    }
                })
            ]);

            // Create Redis adapter constructor
            this.adapterConstructor = createAdapter(pubClient, subClient);

            this.logger.log('✅ Redis adapter initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Redis adapter:', error);
            throw error;
        }
    }

    /**
     * Override createIOServer to apply Redis adapter
     */
    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, options);

        // Apply Redis adapter if available
        if (this.adapterConstructor) {
            server.adapter(this.adapterConstructor);
            this.logger.log('🔌 Redis adapter applied to Socket.IO server');
        } else {
            this.logger.warn('⚠️ Running without Redis adapter (single instance mode)');
        }

        return server;
    }
}
