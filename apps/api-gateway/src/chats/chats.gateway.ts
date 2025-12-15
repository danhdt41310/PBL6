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
import { Logger, Inject, ValidationPipe, UsePipes } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConnectionSocketService } from './services/connection-socket.service';
import { ConversationSocketService } from './services/conversation-socket.service';
import { MessageSocketService } from './services/message-socket.service';
import { ClassSocketService } from './services/class-socket.service';
import {
  SOCKET_EVENTS,
  MessageDeliveredDto,
  MessageReadDto,
  JoinConversationDto,
  JoinClassDto,
  PostCreatedResponse,
} from './dto/socket-events.dto';
import { SOCKET_MESSAGES } from './constants/messages.constant';

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
    private readonly connectionService: ConnectionSocketService,
    private readonly conversationService: ConversationSocketService,
    private readonly messageService: MessageSocketService,
    private readonly classService: ClassSocketService,
  ) {}

  /**
   * Called when WebSocket server is initialized
   */
  async afterInit(server: Server) {
    this.logger.log(SOCKET_MESSAGES.GATEWAY.INITIALIZED);
  }

  /**
   * Handle new client connections
   */
  async handleConnection(client: Socket) {
    await this.connectionService.handleConnection(
      this.server,
      client,
      this.userSockets,
    );
  }

  /**
   * Handle client disconnections
   */
  async handleDisconnect(client: Socket) {
    await this.connectionService.handleDisconnect(
      this.server,
      client,
      this.userSockets,
    );
  }

  /**
   * Handle sending messages with Frontend-first approach
   */
  @SubscribeMessage('message:send')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleSendMessage(
    @MessageBody() messageData: any,
    @ConnectedSocket() client: Socket,
  ) {
    return this.messageService.handleSendMessage(
      this.server,
      client,
      this.chatsService,
      messageData,
    );
  }

  /**
   * Handle user joining a conversation room
   */
  @SubscribeMessage('conversation:join')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleJoinConversation(
    @MessageBody() joinDto: JoinConversationDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.conversationService.handleJoinConversation(
      this.server,
      client,
      this.chatsService,
      this.userSockets,
      joinDto,
    );
  }

  /**
   * Handle user leaving a conversation room
   */
  @SubscribeMessage(SOCKET_EVENTS.LEAVE_CONVERSATION)
  handleLeaveConversation(
    @MessageBody() data: { conversation_id: number },
    @ConnectedSocket() client: Socket,
  ) {
    return this.conversationService.handleLeaveConversation(client, data);
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
    return this.messageService.handleMessageDelivered(
      this.server,
      this.chatsService,
      deliveredDto,
    );
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
    return this.messageService.handleMessageRead(
      this.server,
      this.chatsService,
      readDto,
    );
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
    return this.connectionService.handlePresenceUpdate(this.server, data);
  }

  /**
   * Handle request for multiple users' presence
   */
  @SubscribeMessage(SOCKET_EVENTS.REQUEST_PRESENCE)
  async handleRequestPresence(
    @MessageBody() data: { user_ids: number[] },
    @ConnectedSocket() client: Socket,
  ) {
    return this.connectionService.handleRequestPresence(client, data);
  }

  /**
   * Emit a message to specific conversation
   */
  emitToConversation(conversationId: number, event: string, data: any) {
    this.conversationService.emitToConversation(
      this.server,
      conversationId,
      event,
      data,
    );
  }

  /**
   * Emit a message to specific user
   */
  emitToUser(userId: number, event: string, data: any) {
    this.messageService.emitToUser(this.server, userId, event, data);
  }

  /**
   * Emit a message to specific class
   */
  emitToClass(classId: number, event: string, data: any) {
    this.classService.emitToClass(this.server, classId, event, data);
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
    return this.classService.handleJoinClass(this.server, client, data);
  }

  /**
   * Leave a class room
   */
  @SubscribeMessage(SOCKET_EVENTS.LEAVE_CLASS)
  async handleLeaveClass(
    @MessageBody() data: JoinClassDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.classService.handleLeaveClass(client, data);
  }

  /**
   * Handle new post creation (called from controller)
   */
  async notifyNewPost(postData: PostCreatedResponse) {
    this.classService.notifyNewPost(this.server, postData);
  }

  /**
   * Handle new reply creation (called from controller)
   */
  async notifyNewReply(replyData: PostCreatedResponse) {
    this.classService.notifyNewReply(this.server, replyData);
  }
}
