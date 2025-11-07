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
import { firstValueFrom } from 'rxjs';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

import {
    SendMessageDto,
    JoinConversationDto,
    TypingIndicatorDto,
    MessageDeliveredDto,
    MessageReadDto,
    PresenceUpdateDto,
    SOCKET_EVENTS,
    MessageStatus,
    PresenceStatus,
    MessageResponse,
    ConversationJoinedResponse,
    TypingResponse,
    ErrorResponse,
} from './dto/socket-events.dto';
import { PresenceService } from './services/presence.service';

/**
 * Enhanced WebSocket Gateway for Production-Ready Real-Time Chat
 * 
 * Features:
 * - Type-safe events
 * - Read receipts & delivery status
 * - Typing indicators with debouncing
 * - Online/offline presence
 * - Redis adapter for horizontal scaling
 * - Optimistic updates support
 * - Comprehensive error handling
 * - Reconnection support
 */
@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || true,
        credentials: true,
    },
    namespace: '/chat',
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
})
export class ChatsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatsGateway.name);
    private userSockets: Map<number, Set<string>> = new Map(); // userId -> Set of socketIds
    private socketToUser: Map<string, number> = new Map(); // socketId -> userId
    private typingTimeouts: Map<string, NodeJS.Timeout> = new Map(); // For auto-stopping typing

    constructor(
        @Inject('CHATS_SERVICE') private chatsService: ClientProxy,
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
        private readonly presenceService: PresenceService,
    ) { }

    /**
     * Initialize WebSocket server with Redis adapter
     */
    async afterInit(server: Server) {
        // Create Redis adapter for multi-instance support
        const pubClient = this.redisClient.duplicate();
        const subClient = this.redisClient.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);

        server.adapter(createAdapter(pubClient, subClient));

        this.logger.log('🚀 WebSocket Gateway initialized with Redis adapter');

        // Start presence heartbeat check
        this.startPresenceHeartbeat();
    }

    /**
     * Handle new client connections
     */
    async handleConnection(client: Socket) {
        try {
            const userId = this.extractUserId(client);

            if (!userId) {
                this.logger.warn(`Client ${client.id} connected without valid userId`);
                client.emit(SOCKET_EVENTS.ERROR, {
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                } as ErrorResponse);
                client.disconnect();
                return;
            }

            // Store socket mappings
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)!.add(client.id);
            this.socketToUser.set(client.id, userId);

            // Join user's personal room
            client.join(`user:${userId}`);

            // Update presence to online
            await this.presenceService.setOnline(userId);

            this.logger.log(`✅ Client connected: ${client.id}, User: ${userId}`);

            // Broadcast user online status
            this.server.emit(SOCKET_EVENTS.USER_ONLINE, {
                user_id: userId,
                status: PresenceStatus.ONLINE,
            });

            // Send reconnection confirmation
            client.emit(SOCKET_EVENTS.RECONNECTED, {
                userId,
                timestamp: new Date().toISOString(),
            });

        } catch (error) {
            this.logger.error('Connection error:', error);
            client.emit(SOCKET_EVENTS.ERROR, {
                message: 'Connection failed',
                details: error.message,
            } as ErrorResponse);
            client.disconnect();
        }
    }

    /**
     * Handle client disconnections
     */
    async handleDisconnect(client: Socket) {
        try {
            const userId = this.socketToUser.get(client.id);

            if (!userId) {
                return;
            }

            // Clean up socket mappings
            const sockets = this.userSockets.get(userId);
            if (sockets) {
                sockets.delete(client.id);

                // If user has no more active connections, mark as offline
                if (sockets.size === 0) {
                    this.userSockets.delete(userId);
                    await this.presenceService.setOffline(userId);

                    // Broadcast user offline status
                    this.server.emit(SOCKET_EVENTS.USER_OFFLINE, {
                        user_id: userId,
                        status: PresenceStatus.OFFLINE,
                        last_seen: new Date().toISOString(),
                    });
                }
            }

            this.socketToUser.delete(client.id);

            this.logger.log(`❌ Client disconnected: ${client.id}, User: ${userId}`);

        } catch (error) {
            this.logger.error('Disconnect error:', error);
        }
    }

    /**
     * Handle sending a message
     */
    @SubscribeMessage(SOCKET_EVENTS.SEND_MESSAGE)
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    async handleSendMessage(
        @MessageBody() dto: SendMessageDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            this.logger.log(`📤 Sending message from user ${dto.sender_id}`);

            // Validate sender matches connected user
            const userId = this.socketToUser.get(client.id);
            if (userId !== dto.sender_id) {
                throw new Error('Unauthorized: sender_id mismatch');
            }

            // Send message to chats-service via RPC
            const result = await firstValueFrom(
                this.chatsService.send('messages.create', {
                    ...dto,
                    status: MessageStatus.SENDING,
                })
            );

            if (!result.success) {
                client.emit(SOCKET_EVENTS.MESSAGE_ERROR, {
                    message: result.message || 'Failed to send message',
                    code: 'SEND_FAILED',
                    details: { client_id: dto.client_id },
                } as ErrorResponse);
                return;
            }

            const message: MessageResponse = result.data;

            // Get conversation details
            const conversation = await firstValueFrom(
                this.chatsService.send('conversations.find_one', {
                    id: dto.conversation_id,
                })
            );

            if (!conversation.success) {
                throw new Error('Conversation not found');
            }

            const conversationData = conversation.data;
            const recipientId = conversationData.sender_id === dto.sender_id
                ? conversationData.receiver_id
                : conversationData.sender_id;

            // Update message status to SENT
            const sentMessage: MessageResponse = {
                ...message,
                status: MessageStatus.SENT,
            };

            // Emit to conversation room
            this.server
                .to(`conversation:${dto.conversation_id}`)
                .emit(SOCKET_EVENTS.MESSAGE_RECEIVED, sentMessage);

            // Emit to recipient's personal room
            this.server
                .to(`user:${recipientId}`)
                .emit(SOCKET_EVENTS.MESSAGE_RECEIVED, sentMessage);

            // Confirm to sender
            client.emit(SOCKET_EVENTS.MESSAGE_SENT, sentMessage);

            this.logger.log(`✅ Message sent: ${message.id}`);

            return { success: true, data: sentMessage };

        } catch (error) {
            this.logger.error('Error sending message:', error);

            client.emit(SOCKET_EVENTS.MESSAGE_ERROR, {
                message: error.message || 'Failed to send message',
                code: 'SEND_ERROR',
                details: { client_id: dto.client_id },
            } as ErrorResponse);

            return { success: false, error: error.message };
        }
    }

    /**
     * Handle joining a conversation room
     */
    @SubscribeMessage(SOCKET_EVENTS.JOIN_CONVERSATION)
    @UsePipes(new ValidationPipe({ transform: true }))
    async handleJoinConversation(
        @MessageBody() dto: JoinConversationDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = this.socketToUser.get(client.id);

            if (userId !== dto.user_id) {
                throw new Error('Unauthorized');
            }

            // Verify user is part of this conversation
            const conversation = await firstValueFrom(
                this.chatsService.send('conversations.find_one', {
                    id: dto.conversation_id,
                })
            );

            if (!conversation.success) {
                throw new Error('Conversation not found');
            }

            const conversationData = conversation.data;

            // Check if user is participant
            const isParticipant =
                conversationData.sender_id === userId ||
                conversationData.receiver_id === userId;

            if (!isParticipant) {
                throw new Error('Unauthorized to join this conversation');
            }

            // Join conversation room
            client.join(`conversation:${dto.conversation_id}`);

            // Get participants
            const participants = [conversationData.sender_id, conversationData.receiver_id];
            const onlineParticipants = await this.presenceService.getOnlineUsers(participants);

            const response: ConversationJoinedResponse = {
                conversation_id: dto.conversation_id,
                success: true,
                participants,
                online_participants: onlineParticipants,
            };

            client.emit(SOCKET_EVENTS.CONVERSATION_JOINED, response);

            this.logger.log(`User ${userId} joined conversation ${dto.conversation_id}`);

            return { success: true, data: response };

        } catch (error) {
            this.logger.error('Error joining conversation:', error);

            client.emit(SOCKET_EVENTS.ERROR, {
                message: error.message,
                code: 'JOIN_FAILED',
            } as ErrorResponse);

            return { success: false, error: error.message };
        }
    }

    /**
     * Handle leaving a conversation room
     */
    @SubscribeMessage(SOCKET_EVENTS.LEAVE_CONVERSATION)
    handleLeaveConversation(
        @MessageBody() data: { conversation_id: number },
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(`conversation:${data.conversation_id}`);
        this.logger.log(`Client ${client.id} left conversation ${data.conversation_id}`);
        return { success: true };
    }

    /**
     * Handle typing start
     */
    @SubscribeMessage(SOCKET_EVENTS.TYPING_START)
    @UsePipes(new ValidationPipe({ transform: true }))
    async handleTypingStart(
        @MessageBody() dto: TypingIndicatorDto,
        @ConnectedSocket() client: Socket,
    ) {
        const userId = this.socketToUser.get(client.id);
        if (userId !== dto.user_id) return;

        const typingKey = `${dto.conversation_id}:${dto.user_id}`;

        // Clear existing timeout
        if (this.typingTimeouts.has(typingKey)) {
            clearTimeout(this.typingTimeouts.get(typingKey)!);
        }

        // Broadcast to conversation (except sender)
        const typingResponse: TypingResponse = {
            conversation_id: dto.conversation_id,
            user_id: dto.user_id,
            is_typing: true,
        };

        client.to(`conversation:${dto.conversation_id}`).emit(
            SOCKET_EVENTS.USER_TYPING,
            typingResponse,
        );

        // Auto-stop typing after 3 seconds of inactivity
        const timeout = setTimeout(() => {
            this.handleTypingStop(
                { ...dto, is_typing: false },
                client,
            );
        }, 3000);

        this.typingTimeouts.set(typingKey, timeout);

        return { success: true };
    }

    /**
     * Handle typing stop
     */
    @SubscribeMessage(SOCKET_EVENTS.TYPING_STOP)
    @UsePipes(new ValidationPipe({ transform: true }))
    handleTypingStop(
        @MessageBody() dto: TypingIndicatorDto,
        @ConnectedSocket() client: Socket,
    ) {
        const userId = this.socketToUser.get(client.id);
        if (userId !== dto.user_id) return;

        const typingKey = `${dto.conversation_id}:${dto.user_id}`;

        // Clear timeout
        if (this.typingTimeouts.has(typingKey)) {
            clearTimeout(this.typingTimeouts.get(typingKey)!);
            this.typingTimeouts.delete(typingKey);
        }

        // Broadcast to conversation
        const typingResponse: TypingResponse = {
            conversation_id: dto.conversation_id,
            user_id: dto.user_id,
            is_typing: false,
        };

        client.to(`conversation:${dto.conversation_id}`).emit(
            SOCKET_EVENTS.USER_TYPING,
            typingResponse,
        );

        return { success: true };
    }

    /**
     * Handle message delivered acknowledgment
     */
    @SubscribeMessage(SOCKET_EVENTS.MESSAGE_DELIVERED)
    @UsePipes(new ValidationPipe({ transform: true }))
    async handleMessageDelivered(
        @MessageBody() dto: MessageDeliveredDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Update message status in database
            await firstValueFrom(
                this.chatsService.send('messages.update_status', {
                    message_id: dto.message_id,
                    status: MessageStatus.DELIVERED,
                    delivered_at: dto.delivered_at,
                })
            );

            // Notify sender about delivery
            this.server.emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATED, {
                message_id: dto.message_id,
                status: MessageStatus.DELIVERED,
                delivered_at: dto.delivered_at,
            });

            return { success: true };

        } catch (error) {
            this.logger.error('Error updating message delivery status:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle message read acknowledgment
     */
    @SubscribeMessage(SOCKET_EVENTS.MESSAGE_READ)
    @UsePipes(new ValidationPipe({ transform: true }))
    async handleMessageRead(
        @MessageBody() dto: MessageReadDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Update messages as read in database
            await firstValueFrom(
                this.chatsService.send('messages.mark_as_read', {
                    conversation_id: dto.conversation_id,
                    user_id: dto.user_id,
                    last_read_message_id: dto.last_read_message_id,
                })
            );

            // Notify sender about read status
            this.server.to(`conversation:${dto.conversation_id}`).emit(
                SOCKET_EVENTS.MESSAGE_STATUS_UPDATED,
                {
                    conversation_id: dto.conversation_id,
                    last_read_message_id: dto.last_read_message_id,
                    status: MessageStatus.READ,
                    read_at: dto.read_at,
                    read_by: dto.user_id,
                }
            );

            return { success: true };

        } catch (error) {
            this.logger.error('Error updating message read status:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle presence update
     */
    @SubscribeMessage(SOCKET_EVENTS.PRESENCE_UPDATE)
    @UsePipes(new ValidationPipe({ transform: true }))
    async handlePresenceUpdate(
        @MessageBody() dto: PresenceUpdateDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = this.socketToUser.get(client.id);
            if (userId !== dto.user_id) {
                throw new Error('Unauthorized');
            }

            await this.presenceService.updateStatus(dto.user_id, dto.status);

            // Broadcast presence update
            this.server.emit(SOCKET_EVENTS.USER_PRESENCE, {
                user_id: dto.user_id,
                status: dto.status,
                last_seen: dto.last_seen,
            });

            return { success: true };

        } catch (error) {
            this.logger.error('Error updating presence:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Request presence for specific users
     */
    @SubscribeMessage(SOCKET_EVENTS.REQUEST_PRESENCE)
    async handleRequestPresence(
        @MessageBody() data: { user_ids: number[] },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const presenceMap = await this.presenceService.getMultiplePresence(data.user_ids);
            const presenceList = Array.from(presenceMap.values());

            client.emit(SOCKET_EVENTS.PRESENCE_LIST, presenceList);

            return { success: true };

        } catch (error) {
            this.logger.error('Error fetching presence:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Presence heartbeat - refresh online users every 2 minutes
     */
    private startPresenceHeartbeat() {
        setInterval(async () => {
            for (const [userId, sockets] of this.userSockets.entries()) {
                if (sockets.size > 0) {
                    await this.presenceService.refreshPresence(userId);
                }
            }
        }, 120000); // 2 minutes
    }

    /**
     * Extract userId from socket handshake
     */
    private extractUserId(client: Socket): number | null {
        // Try to get from query params
        const userIdFromQuery = client.handshake.query.userId as string;
        if (userIdFromQuery) {
            return parseInt(userIdFromQuery, 10);
        }

        // Try to get from auth token (if JWT is implemented)
        const token = client.handshake.auth.token;
        if (token) {
            // TODO: Decode JWT and extract userId
            // const decoded = this.jwtService.decode(token);
            // return decoded.userId;
        }

        return null;
    }

    /**
     * Utility: Emit to specific user
     */
    emitToUser(userId: number, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }

    /**
     * Utility: Emit to conversation
     */
    emitToConversation(conversationId: number, event: string, data: any) {
        this.server.to(`conversation:${conversationId}`).emit(event, data);
    }
}
