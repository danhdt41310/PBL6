import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SOCKET_EVENTS } from '../dto/socket-events.dto';
import { SOCKET_MESSAGES, LOG_PREFIX } from '../constants/messages.constant';
import { CHATS_PATTERNS } from '../constants/microservice-patterns.constant';

/**
 * Service to handle conversation-related socket events
 */
@Injectable()
export class ConversationSocketService {
  private readonly logger = new Logger(ConversationSocketService.name);

  /**
   * Handle user joining a conversation room
   */
  async handleJoinConversation(
    server: Server,
    client: Socket,
    chatsService: ClientProxy,
    userSockets: Map<number, Set<string>>,
    data: { conversation_id: number; user_id: number },
  ): Promise<{ success: boolean; conversation_id?: number; error?: string }> {
    try {
      const { conversation_id, user_id } = data;

      // Verify user is part of this conversation
      const conversation = await firstValueFrom(
        chatsService.send(CHATS_PATTERNS.CONVERSATIONS.FIND_ONE, {
          id: conversation_id,
          includeMessages: false,
        }),
      );

      if (!conversation.success) {
        this.logger.error(
          `${LOG_PREFIX.ERROR} ${SOCKET_MESSAGES.CONVERSATION.NOT_FOUND} - Conversation ${conversation_id}`,
        );
        client.emit(SOCKET_EVENTS.ERROR, {
          message: SOCKET_MESSAGES.CONVERSATION.NOT_FOUND,
        });
        return {
          success: false,
          error: SOCKET_MESSAGES.CONVERSATION.NOT_FOUND,
        };
      }

      const conversationData = conversation.data;

      // Check if user is part of conversation
      if (
        conversationData.sender_id !== user_id &&
        conversationData.receiver_id !== user_id
      ) {
        this.logger.warn(
          `${LOG_PREFIX.ERROR} ${SOCKET_MESSAGES.CONVERSATION.UNAUTHORIZED} - User ${user_id} for conversation ${conversation_id}`,
        );
        client.emit(SOCKET_EVENTS.ERROR, {
          message: SOCKET_MESSAGES.CONVERSATION.UNAUTHORIZED,
        });
        return {
          success: false,
          error: SOCKET_MESSAGES.CONVERSATION.UNAUTHORIZED,
        };
      }

      // Join conversation room
      const roomName = `conversation:${conversation_id}`;
      client.join(roomName);

      // Get online participants
      const otherUserId =
        conversationData.sender_id === user_id
          ? conversationData.receiver_id
          : conversationData.sender_id;

      const onlineParticipants = [];
      if (userSockets.has(user_id)) onlineParticipants.push(user_id);
      if (userSockets.has(otherUserId)) onlineParticipants.push(otherUserId);

      const response = {
        conversation_id,
        success: true,
        participants: [
          conversationData.sender_id,
          conversationData.receiver_id,
        ],
        online_participants: onlineParticipants,
      };

      client.emit(SOCKET_EVENTS.CONVERSATION_JOINED, response);

      return {
        success: true,
        conversation_id,
      };
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX.ERROR} ${SOCKET_MESSAGES.CONVERSATION.JOIN_ERROR}: ${error.message}`,
        error.stack,
      );
      client.emit(SOCKET_EVENTS.ERROR, { message: error.message });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle user leaving a conversation room
   */
  handleLeaveConversation(
    client: Socket,
    data: { conversation_id: number },
  ): { success: boolean; conversation_id: number } {
    const { conversation_id } = data;
    client.leave(`conversation:${conversation_id}`);

    return {
      success: true,
      conversation_id,
    };
  }

  /**
   * Emit a message to specific conversation
   */
  emitToConversation(
    server: Server,
    conversationId: number,
    event: string,
    data: any,
  ): void {
    server.to(`conversation:${conversationId}`).emit(event, data);
  }
}
