import { Injectable, Logger, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PresenceStatus, PresenceResponse } from '../dto/socket-events.dto';

/**
 * Presence Service
 * Manages user online/offline status using Redis for fast lookups
 */
@Injectable()
export class PresenceService {
    private readonly logger = new Logger(PresenceService.name);
    private readonly PRESENCE_TTL = 300; // 5 minutes
    private readonly PRESENCE_KEY_PREFIX = 'presence:';

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    ) { }

    /**
     * Mark user as online
     */
    async setOnline(userId: number): Promise<void> {
        const key = this.getPresenceKey(userId);
        const presenceData: PresenceResponse = {
            user_id: userId,
            status: PresenceStatus.ONLINE,
            last_seen: new Date().toISOString(),
        };

        await this.redisClient.setex(
            key,
            this.PRESENCE_TTL,
            JSON.stringify(presenceData),
        );

        this.logger.log(`User ${userId} marked as online`);
    }

    /**
     * Mark user as offline
     */
    async setOffline(userId: number): Promise<void> {
        const key = this.getPresenceKey(userId);
        const presenceData: PresenceResponse = {
            user_id: userId,
            status: PresenceStatus.OFFLINE,
            last_seen: new Date().toISOString(),
        };

        // Keep offline status for 24 hours
        await this.redisClient.setex(
            key,
            86400,
            JSON.stringify(presenceData),
        );

        this.logger.log(`User ${userId} marked as offline`);
    }

    /**
     * Update presence status (away, etc.)
     */
    async updateStatus(userId: number, status: PresenceStatus): Promise<void> {
        const key = this.getPresenceKey(userId);
        const presenceData: PresenceResponse = {
            user_id: userId,
            status,
            last_seen: new Date().toISOString(),
        };

        const ttl = status === PresenceStatus.OFFLINE ? 86400 : this.PRESENCE_TTL;
        await this.redisClient.setex(key, ttl, JSON.stringify(presenceData));

        this.logger.log(`User ${userId} status updated to ${status}`);
    }

    /**
     * Get user presence
     */
    async getPresence(userId: number): Promise<PresenceResponse | null> {
        const key = this.getPresenceKey(userId);
        const data = await this.redisClient.get(key);

        if (!data) {
            return {
                user_id: userId,
                status: PresenceStatus.OFFLINE,
            };
        }

        return JSON.parse(data);
    }

    /**
     * Get multiple users' presence
     */
    async getMultiplePresence(userIds: number[]): Promise<Map<number, PresenceResponse>> {
        const presenceMap = new Map<number, PresenceResponse>();

        if (userIds.length === 0) {
            return presenceMap;
        }

        // Use pipeline for efficient batch queries
        const pipeline = this.redisClient.pipeline();
        userIds.forEach(userId => {
            pipeline.get(this.getPresenceKey(userId));
        });

        const results = await pipeline.exec();

        results?.forEach((result, index) => {
            const [err, data] = result;
            const userId = userIds[index];

            if (!err && data) {
                presenceMap.set(userId, JSON.parse(data as string));
            } else {
                presenceMap.set(userId, {
                    user_id: userId,
                    status: PresenceStatus.OFFLINE,
                });
            }
        });

        return presenceMap;
    }

    /**
     * Refresh user's presence TTL (heartbeat)
     */
    async refreshPresence(userId: number): Promise<void> {
        const key = this.getPresenceKey(userId);
        await this.redisClient.expire(key, this.PRESENCE_TTL);
    }

    /**
     * Get online users from a list
     */
    async getOnlineUsers(userIds: number[]): Promise<number[]> {
        const presenceMap = await this.getMultiplePresence(userIds);
        const onlineUsers: number[] = [];

        presenceMap.forEach((presence, userId) => {
            if (presence.status === PresenceStatus.ONLINE) {
                onlineUsers.push(userId);
            }
        });

        return onlineUsers;
    }

    /**
     * Get all online users (use with caution in production)
     */
    async getAllOnlineUsers(): Promise<number[]> {
        const pattern = `${this.PRESENCE_KEY_PREFIX}*`;
        const keys = await this.redisClient.keys(pattern);
        const onlineUsers: number[] = [];

        if (keys.length === 0) {
            return onlineUsers;
        }

        const pipeline = this.redisClient.pipeline();
        keys.forEach(key => pipeline.get(key));

        const results = await pipeline.exec();

        results?.forEach((result) => {
            const [err, data] = result;
            if (!err && data) {
                const presence: PresenceResponse = JSON.parse(data as string);
                if (presence.status === PresenceStatus.ONLINE) {
                    onlineUsers.push(presence.user_id);
                }
            }
        });

        return onlineUsers;
    }

    /**
     * Helper: Generate Redis key for user presence
     */
    private getPresenceKey(userId: number): string {
        return `${this.PRESENCE_KEY_PREFIX}${userId}`;
    }

    /**
     * Clean up expired presence data (called by cron job)
     */
    async cleanupExpiredPresence(): Promise<void> {
        const pattern = `${this.PRESENCE_KEY_PREFIX}*`;
        const keys = await this.redisClient.keys(pattern);

        let cleaned = 0;
        for (const key of keys) {
            const ttl = await this.redisClient.ttl(key);
            if (ttl < 0) {
                await this.redisClient.del(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.logger.log(`Cleaned up ${cleaned} expired presence records`);
        }
    }
}
