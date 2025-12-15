import { Injectable, Logger } from '@nestjs/common';
import { PresenceStatus, PresenceResponse } from '../dto/socket-events.dto';

/**
 * Presence Service
 * Manages user online/offline status using in-memory Map
 */
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly presenceMap = new Map<number, PresenceResponse>();

  constructor() {}

  /**
   * Mark user as online
   */
  async setOnline(userId: number): Promise<void> {
    const presenceData: PresenceResponse = {
      user_id: userId,
      status: PresenceStatus.ONLINE,
      last_seen: new Date().toISOString(),
    };

    this.presenceMap.set(userId, presenceData);
    this.logger.log(`User ${userId} marked as online`);
  }

  /**
   * Mark user as offline
   */
  async setOffline(userId: number): Promise<void> {
    const presenceData: PresenceResponse = {
      user_id: userId,
      status: PresenceStatus.OFFLINE,
      last_seen: new Date().toISOString(),
    };

    this.presenceMap.set(userId, presenceData);
    this.logger.log(`User ${userId} marked as offline`);
  }

  /**
   * Update presence status (away, etc.)
   */
  async updateStatus(userId: number, status: PresenceStatus): Promise<void> {
    const presenceData: PresenceResponse = {
      user_id: userId,
      status,
      last_seen: new Date().toISOString(),
    };

    this.presenceMap.set(userId, presenceData);
    this.logger.log(`User ${userId} status updated to ${status}`);
  }

  /**
   * Get user presence
   */
  async getPresence(userId: number): Promise<PresenceResponse | null> {
    const presence = this.presenceMap.get(userId);

    if (!presence) {
      return {
        user_id: userId,
        status: PresenceStatus.OFFLINE,
      };
    }

    return presence;
  }

  /**
   * Get multiple users' presence
   */
  async getMultiplePresence(
    userIds: number[],
  ): Promise<Map<number, PresenceResponse>> {
    const resultMap = new Map<number, PresenceResponse>();

    if (userIds.length === 0) {
      return resultMap;
    }

    userIds.forEach((userId) => {
      const presence = this.presenceMap.get(userId);
      if (presence) {
        resultMap.set(userId, presence);
      } else {
        resultMap.set(userId, {
          user_id: userId,
          status: PresenceStatus.OFFLINE,
        });
      }
    });

    return resultMap;
  }

  /**
   * Get online users from a list
   */
  async getOnlineUsers(userIds: number[]): Promise<number[]> {
    const onlineUsers: number[] = [];

    userIds.forEach((userId) => {
      const presence = this.presenceMap.get(userId);
      if (presence && presence.status === PresenceStatus.ONLINE) {
        onlineUsers.push(userId);
      }
    });

    return onlineUsers;
  }

  /**
   * Get all online users
   */
  async getAllOnlineUsers(): Promise<number[]> {
    const onlineUsers: number[] = [];

    this.presenceMap.forEach((presence) => {
      if (presence.status === PresenceStatus.ONLINE) {
        onlineUsers.push(presence.user_id);
      }
    });

    return onlineUsers;
  }

  /**
   * Remove user presence (cleanup)
   */
  async removePresence(userId: number): Promise<void> {
    this.presenceMap.delete(userId);
    this.logger.log(`User ${userId} presence removed`);
  }

  /**
   * Get total online users count
   */
  getOnlineUsersCount(): number {
    let count = 0;
    this.presenceMap.forEach((presence) => {
      if (presence.status === PresenceStatus.ONLINE) {
        count++;
      }
    });
    return count;
  }
}
