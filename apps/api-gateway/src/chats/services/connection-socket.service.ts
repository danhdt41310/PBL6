import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PresenceService } from './presence.service';
import { SOCKET_EVENTS } from '../dto/socket-events.dto';
import { SOCKET_MESSAGES, LOG_PREFIX } from '../constants/messages.constant';

/**
 * Service to handle user connection and presence-related socket events
 */
@Injectable()
export class ConnectionSocketService {
  private readonly logger = new Logger(ConnectionSocketService.name);

  constructor(private readonly presenceService: PresenceService) {}

  /**
   * Handle new client connections
   */
  async handleConnection(
    server: Server,
    client: Socket,
    userSockets: Map<number, Set<string>>,
  ): Promise<void> {
    try {
      const userId = client.handshake.query.userId as string;

      if (!userId) {
        this.logger.warn(
          `${LOG_PREFIX.CONNECTION} ${SOCKET_MESSAGES.CONNECTION.CONNECTION_WITHOUT_USER_ID}`,
        );
        return;
      }

      const userIdNum = parseInt(userId, 10);

      if (!userSockets.has(userIdNum)) {
        userSockets.set(userIdNum, new Set());
      }
      userSockets.get(userIdNum).add(client.id);

      client.join(`user:${userIdNum}`);

      await this.presenceService.setOnline(userIdNum);

      server.emit(SOCKET_EVENTS.USER_ONLINE, {
        user_id: userIdNum,
        status: 'online',
        last_seen: new Date().toISOString(),
      });

      this.logger.log(
        `${LOG_PREFIX.CONNECTION} ${SOCKET_MESSAGES.CONNECTION.USER_CONNECTED} ${userIdNum} (socket: ${client.id})`,
      );
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX.ERROR} ${SOCKET_MESSAGES.CONNECTION.CONNECTION_ERROR}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle client disconnections
   */
  async handleDisconnect(
    server: Server,
    client: Socket,
    userSockets: Map<number, Set<string>>,
  ): Promise<void> {
    try {
      const userId = client.handshake.query.userId as string;

      if (userId) {
        const userIdNum = parseInt(userId, 10);
        const sockets = userSockets.get(userIdNum);

        if (sockets) {
          sockets.delete(client.id);

          if (sockets.size === 0) {
            userSockets.delete(userIdNum);
            await this.presenceService.setOffline(userIdNum);

            server.emit(SOCKET_EVENTS.USER_OFFLINE, {
              user_id: userIdNum,
              status: 'offline',
              last_seen: new Date().toISOString(),
            });

            this.logger.log(
              `${LOG_PREFIX.DISCONNECT} ${SOCKET_MESSAGES.CONNECTION.USER_DISCONNECTED} - User ${userIdNum}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX.ERROR} ${SOCKET_MESSAGES.CONNECTION.DISCONNECT_ERROR}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle presence update request
   */
  async handlePresenceUpdate(
    server: Server,
    data: { user_id: number; status: string; last_seen?: string },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { user_id, status } = data;

      await this.presenceService.updateStatus(user_id, status as any);

      server.emit(SOCKET_EVENTS.USER_PRESENCE, {
        user_id,
        status,
        last_seen: data.last_seen || new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX.ERROR} ${SOCKET_MESSAGES.PRESENCE.UPDATE_ERROR}: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle request for multiple users' presence
   */
  async handleRequestPresence(
    client: Socket,
    data: { user_ids: number[] },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { user_ids } = data;

      const presenceMap =
        await this.presenceService.getMultiplePresence(user_ids);
      const presenceList = Array.from(presenceMap.values());

      client.emit(SOCKET_EVENTS.PRESENCE_LIST, presenceList);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX.ERROR} ${SOCKET_MESSAGES.PRESENCE.REQUEST_ERROR}: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }
}
