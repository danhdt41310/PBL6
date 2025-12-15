import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  ClassJoinedResponse,
  PostCreatedResponse,
} from '../dto/socket-events.dto';
import { SOCKET_MESSAGES, LOG_PREFIX } from '../constants/messages.constant';

/**
 * Service to handle class and post-related socket events
 */
@Injectable()
export class ClassSocketService {
  private readonly logger = new Logger(ClassSocketService.name);

  /**
   * Join a class room for real-time post updates
   */
  async handleJoinClass(
    server: Server,
    client: Socket,
    data: { class_id: number; user_id: number },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { class_id, user_id } = data;

      client.join(`class:${class_id}`);

      const room = server.sockets.adapter.rooms.get(`class:${class_id}`);
      const membersCount = room ? room.size : 1;

      const response: ClassJoinedResponse = {
        class_id,
        success: true,
        members_count: membersCount,
      };

      client.emit(SOCKET_EVENTS.CLASS_JOINED, response);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX.ERROR} ${SOCKET_MESSAGES.CLASS.JOIN_ERROR}: ${error.message}`,
        error.stack,
      );
      client.emit(SOCKET_EVENTS.ERROR, {
        message: SOCKET_MESSAGES.CLASS.JOIN_FAILED,
        code: SOCKET_MESSAGES.CLASS.JOIN_ERROR_CODE,
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Leave a class room
   */
  handleLeaveClass(
    client: Socket,
    data: { class_id: number },
  ): { success: boolean } {
    const { class_id } = data;
    client.leave(`class:${class_id}`);
    return { success: true };
  }

  /**
   * Notify new post creation to class members
   */
  notifyNewPost(server: Server, postData: PostCreatedResponse): void {
    this.emitToClass(
      server,
      postData.class_id,
      SOCKET_EVENTS.POST_CREATED,
      postData,
    );
  }

  /**
   * Notify new reply creation to class members
   */
  notifyNewReply(server: Server, replyData: PostCreatedResponse): void {
    this.emitToClass(
      server,
      replyData.class_id,
      SOCKET_EVENTS.REPLY_CREATED,
      replyData,
    );
  }

  /**
   * Emit a message to specific class
   */
  emitToClass(server: Server, classId: number, event: string, data: any): void {
    server.to(`class:${classId}`).emit(event, data);
  }
}
