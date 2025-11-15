import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  Logger,
  UseGuards,
  Inject,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateMessageDto } from '../dto/message.dto';
import { firstValueFrom } from 'rxjs';
import { Redis } from 'ioredis';
import { PresenceService } from './services/presence.service';
import {
  SOCKET_EVENTS,
  MessageDeliveredDto,
  MessageReadDto,
  JoinConversationDto,
  MessageStatus,
  JoinClassDto,
  CreatePostDto,
  CreateReplyDto,
  PostCreatedResponse,
  ClassJoinedResponse,
} from './dto/socket-events.dto';

/**
 * WebSocket Gateway for real-time chat functionality
 * Handles socket connections, message sending, and typing indicators
 */
@WebSocketGateway({
  cors: {
    origin: true, // In production, specify allowed origins
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatsGateway.name);
  private userSockets: Map<number, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(
    @Inject('CHATS_SERVICE') private chatsService: ClientProxy,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly presenceService: PresenceService,
  ) {}

  /**
   * Called when WebSocket server is initialized
   */
  async afterInit(server: Server) {
    // WebSocket server initialized
  }

  /**
   * Handle new client connections
   */
  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;

      if (!userId) {
        return;
      }

      const userIdNum = parseInt(userId, 10);

      if (!this.userSockets.has(userIdNum)) {
        this.userSockets.set(userIdNum, new Set());
      }
      this.userSockets.get(userIdNum).add(client.id);

      client.join(`user:${userIdNum}`);

      await this.presenceService.setOnline(userIdNum);

      this.server.emit(SOCKET_EVENTS.USER_ONLINE, {
        user_id: userIdNum,
        status: 'online',
        last_seen: new Date().toISOString(),
      });
    } catch (error) {
      // Connection error
    }
  }

  /**
   * Handle client disconnections
   */
  async handleDisconnect(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;

      if (userId) {
        const userIdNum = parseInt(userId, 10);
        const sockets = this.userSockets.get(userIdNum);

        if (sockets) {
          sockets.delete(client.id);

          if (sockets.size === 0) {
            this.userSockets.delete(userIdNum);
            await this.presenceService.setOffline(userIdNum);

            this.server.emit(SOCKET_EVENTS.USER_OFFLINE, {
              user_id: userIdNum,
              status: 'offline',
              last_seen: new Date().toISOString(),
            });
          }
        }
      }
    } catch (error) {
      // Disconnect error
    }
  }

  /**
   * Handle sending messages with Frontend-first approach
   * Frontend broadcasts via Socket.IO first, then saves to DB via REST API
   * This handler only broadcasts the message to other clients in real-time
   */
  @SubscribeMessage('message:send')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleSendMessage(
    @MessageBody() messageData: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const authenticatedUserId = parseInt(
        client.handshake.query.userId as string,
        10,
      );

      if (messageData.sender_id !== authenticatedUserId) {
        return;
      }

      const conversationId = messageData.conversation_id;
      const senderId = messageData.sender_id;

      const conversation = await firstValueFrom(
        this.chatsService.send('conversations.find_one', {
          id: conversationId,
          includeMessages: false,
        }),
      );

      if (!conversation.success) {
        return;
      }

      const conversationData = conversation.data;

      const isParticipant =
        conversationData.sender_id === senderId ||
        conversationData.receiver_id === senderId;

      if (!isParticipant) {
        return;
      }

      const roomName = `conversation:${conversationId}`;
      const receiverId =
        conversationData.sender_id === senderId
          ? conversationData.receiver_id
          : conversationData.sender_id;

      this.server
        .to(roomName)
        .emit(SOCKET_EVENTS.MESSAGE_RECEIVED, messageData);

      this.server
        .to(`user:${receiverId}`)
        .emit(SOCKET_EVENTS.MESSAGE_RECEIVED, messageData);

      return {
        success: true,
        message: 'Broadcasted to room',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  } /**
   * Handle user joining a conversation room
   */
  @SubscribeMessage('conversation:join')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleJoinConversation(
    @MessageBody() joinDto: JoinConversationDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { conversation_id, user_id } = joinDto;

      // Verify user is part of this conversation
      const conversation = await firstValueFrom(
        this.chatsService.send('conversations.find_one', {
          id: conversation_id,
          includeMessages: false,
        }),
      );

      if (!conversation.success) {
        this.logger.error(`   ❌ Conversation ${conversation_id} NOT FOUND`);
        client.emit(SOCKET_EVENTS.ERROR, { message: 'Conversation not found' });
        return;
      }

      const conversationData = conversation.data;

      // Check if user is part of conversation
      if (
        conversationData.sender_id !== user_id &&
        conversationData.receiver_id !== user_id
      ) {
        this.logger.warn(
          `   ⚠️ User ${user_id} NOT authorized for conversation ${conversation_id}`,
        );
        client.emit(SOCKET_EVENTS.ERROR, {
          message: 'Unauthorized to join this conversation',
        });
        return;
      }

      // Join conversation room
      const roomName = `conversation:${conversation_id}`;
      client.join(roomName);

      // Get room info after join
      const roomSockets = await this.server.in(roomName).fetchSockets();

      // Get online participants
      const otherUserId =
        conversationData.sender_id === user_id
          ? conversationData.receiver_id
          : conversationData.sender_id;

      const onlineParticipants = [];
      if (this.userSockets.has(user_id)) onlineParticipants.push(user_id);
      if (this.userSockets.has(otherUserId))
        onlineParticipants.push(otherUserId);

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
  @SubscribeMessage(SOCKET_EVENTS.LEAVE_CONVERSATION)
  handleLeaveConversation(
    @MessageBody() data: { conversation_id: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { conversation_id } = data;
    client.leave(`conversation:${conversation_id}`);

    return {
      success: true,
      conversation_id,
    };
  }

  /**
   * Handle message delivered acknowledgment
   */
  @SubscribeMessage(SOCKET_EVENTS.MESSAGE_DELIVERED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleMessageDelivered(
    @MessageBody() deliveredDto: MessageDeliveredDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { message_id, user_id, delivered_at } = deliveredDto;

      if (!message_id || message_id <= 0) {
        return { success: false, error: 'Invalid message_id' };
      }

      const messageResult = await firstValueFrom(
        this.chatsService.send('messages.find_one', message_id),
      );

      if (!messageResult.success) {
        return { success: false, error: 'Message not found' };
      }

      const message = messageResult.data;

      this.server
        .to(`user:${message.sender_id}`)
        .emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATED, {
          message_id,
          status: MessageStatus.DELIVERED,
          delivered_at,
        });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle message read acknowledgment
   */
  @SubscribeMessage(SOCKET_EVENTS.MESSAGE_READ)
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleMessageRead(
    @MessageBody() readDto: MessageReadDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { conversation_id, user_id, last_read_message_id, read_at } =
        readDto;

      const conversation = await firstValueFrom(
        this.chatsService.send('conversations.find_one', {
          id: conversation_id,
          includeMessages: false,
        }),
      );

      if (!conversation.success) {
        return { success: false, error: 'Conversation not found' };
      }

      const conversationData = conversation.data;
      const otherUserId =
        conversationData.sender_id === user_id
          ? conversationData.receiver_id
          : conversationData.sender_id;

      const markReadResult = await firstValueFrom(
        this.chatsService.send('messages.mark_as_read', {
          conversation_id,
          user_id,
          message_ids: undefined,
        }),
      );

      this.server
        .to(`user:${otherUserId}`)
        .emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATED, {
          conversation_id,
          last_read_message_id,
          status: MessageStatus.READ,
          read_at,
          read_by: user_id,
        });

      this.server.to(`conversation:${conversation_id}`).emit('messages:read', {
        conversation_id,
        user_id,
        count: markReadResult.count || 0,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle presence update request
   */
  @SubscribeMessage(SOCKET_EVENTS.PRESENCE_UPDATE)
  async handlePresenceUpdate(
    @MessageBody()
    data: { user_id: number; status: string; last_seen?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { user_id, status } = data;

      await this.presenceService.updateStatus(user_id, status as any);

      this.server.emit(SOCKET_EVENTS.USER_PRESENCE, {
        user_id,
        status,
        last_seen: data.last_seen || new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle request for multiple users' presence
   */
  @SubscribeMessage(SOCKET_EVENTS.REQUEST_PRESENCE)
  async handleRequestPresence(
    @MessageBody() data: { user_ids: number[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { user_ids } = data;

      const presenceMap =
        await this.presenceService.getMultiplePresence(user_ids);
      const presenceList = Array.from(presenceMap.values());

      client.emit(SOCKET_EVENTS.PRESENCE_LIST, presenceList);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Emit a message to specific conversation (used by service layer)
   */
  emitToConversation(conversationId: number, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  /**
   * Emit a message to specific user (used by service layer)
   */
  emitToUser(userId: number, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit a message to specific class (used by service layer)
   */
  emitToClass(classId: number, event: string, data: any) {
    this.server.to(`class:${classId}`).emit(event, data);
  }

  // ==================== POST EVENTS ====================

  /**
   * Join a class room for real-time post updates
   */
  @SubscribeMessage(SOCKET_EVENTS.JOIN_CLASS)
  async handleJoinClass(
    @MessageBody() data: JoinClassDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { class_id, user_id } = data;

      client.join(`class:${class_id}`);

      const room = this.server.sockets.adapter.rooms.get(`class:${class_id}`);
      const membersCount = room ? room.size : 1;

      const response: ClassJoinedResponse = {
        class_id,
        success: true,
        members_count: membersCount,
      };

      client.emit(SOCKET_EVENTS.CLASS_JOINED, response);
    } catch (error) {
      client.emit(SOCKET_EVENTS.ERROR, {
        message: 'Failed to join class',
        code: 'JOIN_CLASS_ERROR',
      });
    }
  }

  /**
   * Leave a class room
   */
  @SubscribeMessage(SOCKET_EVENTS.LEAVE_CLASS)
  async handleLeaveClass(
    @MessageBody() data: JoinClassDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { class_id } = data;
    client.leave(`class:${class_id}`);
  }

  /**
   * Handle new post creation (called from controller)
   */
  async notifyNewPost(postData: PostCreatedResponse) {
    this.emitToClass(postData.class_id, SOCKET_EVENTS.POST_CREATED, postData);
  }

  /**
   * Handle new reply creation (called from controller)
   */
  async notifyNewReply(replyData: PostCreatedResponse) {
    this.emitToClass(
      replyData.class_id,
      SOCKET_EVENTS.REPLY_CREATED,
      replyData,
    );
  }
}
