import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SOCKET_EVENTS, MessageStatus } from '../dto/socket-events.dto';
import { SOCKET_MESSAGES, LOG_PREFIX } from '../constants/messages.constant';
import {
  CHATS_PATTERNS,
  SOCKET_EVENT_PATTERNS,
} from '../constants/microservice-patterns.constant';

/**
 * Service to handle message-related socket events
 */
@Injectable()
export class MessageSocketService {
  private readonly logger = new Logger(MessageSocketService.name);

  /**
   * Handle sending messages with Frontend-first approach
   */
  async handleSendMessage(
    server: Server,
    client: Socket,
    chatsService: ClientProxy,
    messageData: any,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const authenticatedUserId = parseInt(
        client.handshake.query.userId as string,
        10,
      );

      if (messageData.sender_id !== authenticatedUserId) {
        return {
          success: false,
          error: SOCKET_MESSAGES.MESSAGE.UNAUTHORIZED_SEND,
        };
      }

      const conversationId = messageData.conversation_id;
      const senderId = messageData.sender_id;

      const conversation = await firstValueFrom(
        chatsService.send(CHATS_PATTERNS.CONVERSATIONS.FIND_ONE, {
          id: conversationId,
          includeMessages: false,
        }),
      );

      if (!conversation.success) {
        return {
          success: false,
          error: SOCKET_MESSAGES.CONVERSATION.NOT_FOUND,
        };
      }

      const conversationData = conversation.data;

      const isParticipant =
        conversationData.sender_id === senderId ||
        conversationData.receiver_id === senderId;

      if (!isParticipant) {
        return {
          success: false,
          error: SOCKET_MESSAGES.MESSAGE.NOT_PARTICIPANT,
        };
      }

      const roomName = `conversation:${conversationId}`;
      const receiverId =
        conversationData.sender_id === senderId
          ? conversationData.receiver_id
          : conversationData.sender_id;

      server.to(roomName).emit(SOCKET_EVENTS.MESSAGE_RECEIVED, messageData);

      server
        .to(`user:${receiverId}`)
        .emit(SOCKET_EVENTS.MESSAGE_RECEIVED, messageData);

      return {
        success: true,
        message: SOCKET_MESSAGES.MESSAGE.BROADCASTED,
      };
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX.ERROR} ${SOCKET_MESSAGES.MESSAGE.SEND_ERROR}: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle message delivered acknowledgment
   */
  async handleMessageDelivered(
    server: Server,
    chatsService: ClientProxy,
    data: { message_id: number; user_id: number; delivered_at: string },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { message_id, user_id, delivered_at } = data;

      if (!message_id || message_id <= 0) {
        return {
          success: false,
          error: SOCKET_MESSAGES.MESSAGE.INVALID_MESSAGE_ID,
        };
      }

      const messageResult = await firstValueFrom(
        chatsService.send(CHATS_PATTERNS.MESSAGES.FIND_ONE, message_id),
      );

      if (!messageResult.success) {
        return { success: false, error: SOCKET_MESSAGES.MESSAGE.NOT_FOUND };
      }

      const message = messageResult.data;

      server
        .to(`user:${message.sender_id}`)
        .emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATED, {
          message_id,
          status: MessageStatus.DELIVERED,
          delivered_at,
        });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX.ERROR} ${SOCKET_MESSAGES.MESSAGE.DELIVERED_ERROR}: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle message read acknowledgment
   */
  async handleMessageRead(
    server: Server,
    chatsService: ClientProxy,
    data: {
      conversation_id: number;
      user_id: number;
      last_read_message_id: number;
      read_at: string;
    },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { conversation_id, user_id, last_read_message_id, read_at } = data;

      const conversation = await firstValueFrom(
        chatsService.send('conversations.find_one', {
          id: conversation_id,
          includeMessages: false,
        }),
      );

      if (!conversation.success) {
        return {
          success: false,
          error: SOCKET_MESSAGES.CONVERSATION.NOT_FOUND,
        };
      }

      const conversationData = conversation.data;
      const otherUserId =
        conversationData.sender_id === user_id
          ? conversationData.receiver_id
          : conversationData.sender_id;

      const markReadResult = await firstValueFrom(
        chatsService.send('messages.mark_as_read', {
          conversation_id,
          user_id,
          message_ids: undefined,
        }),
      );

      server
        .to(`user:${otherUserId}`)
        .emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATED, {
          conversation_id,
          last_read_message_id,
          status: MessageStatus.READ,
          read_at,
          read_by: user_id,
        });

      server
        .to(`conversation:${conversation_id}`)
        .emit(SOCKET_EVENT_PATTERNS.MESSAGES_READ, {
          conversation_id,
          user_id,
          count: markReadResult.count || 0,
        });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX.ERROR} ${SOCKET_MESSAGES.MESSAGE.READ_ERROR}: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Emit a message to specific user
   */
  emitToUser(server: Server, userId: number, event: string, data: any): void {
    server.to(`user:${userId}`).emit(event, data);
  }
}
