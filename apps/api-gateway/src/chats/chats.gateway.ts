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
import { Logger, UseGuards, Inject, ValidationPipe, UsePipes } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateMessageDto } from '../dto/message.dto';
import { firstValueFrom } from 'rxjs';
import { Redis } from 'ioredis';
import { PresenceService } from './services/presence.service';
import {
    SOCKET_EVENTS,
    SendMessageDto,
    MessageDeliveredDto,
    MessageReadDto,
    TypingIndicatorDto,
    JoinConversationDto,
    MessageStatus,
    MessageType,
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
export class ChatsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatsGateway.name);
    private userSockets: Map<number, Set<string>> = new Map(); // userId -> Set of socketIds

    constructor(
        @Inject('CHATS_SERVICE') private chatsService: ClientProxy,
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
        private readonly presenceService: PresenceService,
    ) { }

    /**
     * Called when WebSocket server is initialized
     */
    async afterInit(server: Server) {
        this.logger.log('🔌 WebSocket Gateway initialized');
        this.logger.log(`📍 Namespace: /chat`);
        this.logger.log(`🌐 CORS enabled for all origins`);
    }

    /**
     * Handle new client connections
     */
    async handleConnection(client: Socket) {
        try {
            this.logger.log('='.repeat(60));
            this.logger.log('🔌 [CONNECTION] New client connecting...');
            this.logger.log(`   Socket ID: ${client.id}`);
            this.logger.log(`   Query params:`, client.handshake.query);

            // Extract userId from query params or auth token
            const userId = client.handshake.query.userId as string;

            if (!userId) {
                this.logger.warn(`❌ [CONNECTION] Client ${client.id} connected WITHOUT userId`);
                this.logger.log('='.repeat(60));
                return;
            }

            const userIdNum = parseInt(userId, 10);
            this.logger.log(`   User ID: ${userIdNum}`);

            // Store socket connection for this user
            if (!this.userSockets.has(userIdNum)) {
                this.userSockets.set(userIdNum, new Set());
                this.logger.log(`   Created new socket set for user ${userIdNum}`);
            }
            this.userSockets.get(userIdNum).add(client.id);
            this.logger.log(`   Total connections for user ${userIdNum}: ${this.userSockets.get(userIdNum).size}`);

            // Join user to their personal room
            client.join(`user:${userIdNum}`);
            this.logger.log(`   ✅ Joined personal room: user:${userIdNum}`);

            // Mark user as online in Redis
            await this.presenceService.setOnline(userIdNum);
            this.logger.log(`   ✅ Marked as ONLINE in Redis`);

            // Notify all clients that user is online
            this.server.emit(SOCKET_EVENTS.USER_ONLINE, {
                user_id: userIdNum,
                status: 'online',
                last_seen: new Date().toISOString(),
            });
            this.logger.log(`   ✅ Broadcasted USER_ONLINE event`);

            this.logger.log(`✅ [CONNECTION] Client connected successfully: ${client.id}, User: ${userIdNum}`);
            this.logger.log('='.repeat(60));
        } catch (error) {
            this.logger.error('❌ [CONNECTION] Error:', error);
            this.logger.log('='.repeat(60));
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

                    // If user has no more active connections, mark as offline
                    if (sockets.size === 0) {
                        this.userSockets.delete(userIdNum);

                        // Mark user as offline in Redis
                        await this.presenceService.setOffline(userIdNum);

                        // Notify all clients that user is offline
                        this.server.emit(SOCKET_EVENTS.USER_OFFLINE, {
                            user_id: userIdNum,
                            status: 'offline',
                            last_seen: new Date().toISOString(),
                        });
                    }
                }
            }

            this.logger.log(`Client disconnected: ${client.id}`);
        } catch (error) {
            this.logger.error('Disconnect error:', error);
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
        @MessageBody() messageData: any, // Already formatted message from frontend
        @ConnectedSocket() client: Socket,
    ) {
        try {
            this.logger.log('='.repeat(60));
            this.logger.log('📨 [SEND_MESSAGE] Received message for broadcast');
            this.logger.log(`   Socket ID: ${client.id}`);
            this.logger.log(`   Message data:`, JSON.stringify(messageData, null, 2));

            // Extract authenticated userId from socket
            const authenticatedUserId = parseInt(client.handshake.query.userId as string, 10);
            this.logger.log(`   Authenticated User ID: ${authenticatedUserId}`);

            // Security: Verify sender_id matches authenticated user
            if (messageData.sender_id !== authenticatedUserId) {
                this.logger.warn(`⚠️ [SECURITY] Unauthorized broadcast attempt!`);
                this.logger.warn(`   Expected sender: ${authenticatedUserId}, Got: ${messageData.sender_id}`);
                this.logger.log('='.repeat(60));
                return;
            }

            const conversationId = messageData.conversation_id;
            const senderId = messageData.sender_id;
            this.logger.log(`   Conversation ID: ${conversationId}`);
            this.logger.log(`   Sender ID: ${senderId}`);

            // Verify conversation exists (security check)
            this.logger.log(`   🔍 Verifying conversation exists...`);
            const conversation = await firstValueFrom(
                this.chatsService.send('conversations.find_one', {
                    id: conversationId,
                    includeMessages: false,
                })
            );

            if (!conversation.success) {
                this.logger.error(`❌ [SEND_MESSAGE] Conversation ${conversationId} NOT FOUND`);
                this.logger.log('='.repeat(60));
                return;
            }
            this.logger.log(`   ✅ Conversation found`);

            // Verify user is part of this conversation
            const conversationData = conversation.data;
            this.logger.log(`   Conversation participants: sender=${conversationData.sender_id}, receiver=${conversationData.receiver_id}`);

            const isParticipant = conversationData.sender_id === senderId || conversationData.receiver_id === senderId;

            if (!isParticipant) {
                this.logger.warn(`⚠️ [SECURITY] User ${senderId} is NOT part of conversation ${conversationId}`);
                this.logger.log('='.repeat(60));
                return;
            }
            this.logger.log(`   ✅ User is participant`);

            // Get room info
            const roomName = `conversation:${conversationId}`;
            const roomSockets = await this.server.in(roomName).fetchSockets();
            this.logger.log(`   📡 Broadcasting to room: ${roomName}`);
            this.logger.log(`   👥 Sockets in room: ${roomSockets.length}`);
            roomSockets.forEach((s, i) => {
                this.logger.log(`      [${i + 1}] Socket ${s.id}`);
            });

            // ===== BROADCAST TO CONVERSATION ROOM ONLY =====
            this.server
                .to(roomName)
                .emit(SOCKET_EVENTS.MESSAGE_RECEIVED, messageData);

            this.logger.log(`   ✅ Message broadcasted successfully`);
            this.logger.log(`   Event: ${SOCKET_EVENTS.MESSAGE_RECEIVED}`);
            this.logger.log('='.repeat(60));

            return {
                success: true,
                message: 'Broadcasted to room',
            };
        } catch (error) {
            this.logger.error('='.repeat(60));
            this.logger.error('❌ [SEND_MESSAGE] Error broadcasting message:', error);
            this.logger.error('='.repeat(60));
            return {
                success: false,
                error: error.message,
            };
        }
    }    /**
     * Handle user joining a conversation room
     */
    @SubscribeMessage('conversation:join')
    @UsePipes(new ValidationPipe({ transform: true }))
    async handleJoinConversation(
        @MessageBody() joinDto: JoinConversationDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            this.logger.log('='.repeat(60));
            this.logger.log('🚪 [JOIN_CONVERSATION] User joining conversation');
            this.logger.log(`   Socket ID: ${client.id}`);
            this.logger.log(`   Join data:`, joinDto);

            const { conversation_id, user_id } = joinDto;
            this.logger.log(`   Conversation ID: ${conversation_id}`);
            this.logger.log(`   User ID: ${user_id}`);

            // Verify user is part of this conversation
            this.logger.log(`   🔍 Verifying conversation exists...`);
            const conversation = await firstValueFrom(
                this.chatsService.send('conversations.find_one', {
                    id: conversation_id,
                    includeMessages: false,
                })
            );

            if (!conversation.success) {
                this.logger.error(`   ❌ Conversation ${conversation_id} NOT FOUND`);
                client.emit(SOCKET_EVENTS.ERROR, { message: 'Conversation not found' });
                this.logger.log('='.repeat(60));
                return;
            }
            this.logger.log(`   ✅ Conversation found`);

            const conversationData = conversation.data;
            this.logger.log(`   Participants: sender=${conversationData.sender_id}, receiver=${conversationData.receiver_id}`);

            // Check if user is part of conversation
            if (conversationData.sender_id !== user_id && conversationData.receiver_id !== user_id) {
                this.logger.warn(`   ⚠️ User ${user_id} NOT authorized for conversation ${conversation_id}`);
                client.emit(SOCKET_EVENTS.ERROR, { message: 'Unauthorized to join this conversation' });
                this.logger.log('='.repeat(60));
                return;
            }
            this.logger.log(`   ✅ User is authorized`);

            // Join conversation room
            const roomName = `conversation:${conversation_id}`;
            client.join(roomName);
            this.logger.log(`   ✅ Joined room: ${roomName}`);

            // Get room info after join
            const roomSockets = await this.server.in(roomName).fetchSockets();
            this.logger.log(`   👥 Total sockets in room now: ${roomSockets.length}`);
            roomSockets.forEach((s, i) => {
                this.logger.log(`      [${i + 1}] Socket ${s.id}`);
            });

            // Get online participants
            const otherUserId = conversationData.sender_id === user_id
                ? conversationData.receiver_id
                : conversationData.sender_id;

            const onlineParticipants = [];
            if (this.userSockets.has(user_id)) onlineParticipants.push(user_id);
            if (this.userSockets.has(otherUserId)) onlineParticipants.push(otherUserId);
            this.logger.log(`   Online participants:`, onlineParticipants);

            const response = {
                conversation_id,
                success: true,
                participants: [conversationData.sender_id, conversationData.receiver_id],
                online_participants: onlineParticipants,
            };

            client.emit(SOCKET_EVENTS.CONVERSATION_JOINED, response);
            this.logger.log(`   ✅ Emitted CONVERSATION_JOINED to client`);
            this.logger.log(`   Response:`, response);

            this.logger.log(`✅ [JOIN_CONVERSATION] User ${user_id} successfully joined conversation ${conversation_id}`);
            this.logger.log('='.repeat(60));

            return {
                success: true,
                conversation_id,
            };
        } catch (error) {
            this.logger.error('='.repeat(60));
            this.logger.error('❌ [JOIN_CONVERSATION] Error:', error);
            this.logger.error('='.repeat(60));
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

        this.logger.log(`Client ${client.id} left conversation ${conversation_id}`);

        return {
            success: true,
            conversation_id,
        };
    }

    /**
     * Handle typing indicator
     */
    @SubscribeMessage(SOCKET_EVENTS.TYPING_START)
    @SubscribeMessage(SOCKET_EVENTS.TYPING_STOP)
    @UsePipes(new ValidationPipe({ transform: true }))
    handleTyping(
        @MessageBody() typingDto: TypingIndicatorDto,
        @ConnectedSocket() client: Socket,
    ) {
        const { conversation_id, user_id, is_typing } = typingDto;

        // Broadcast typing status to conversation room (except sender)
        client.to(`conversation:${conversation_id}`).emit(SOCKET_EVENTS.USER_TYPING, {
            conversation_id,
            user_id,
            is_typing,
        });

        return {
            success: true,
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

            this.logger.log(`Message ${message_id} delivered to user ${user_id}`);

            // Get message to find sender
            const messageResult = await firstValueFrom(
                this.chatsService.send('messages.find_one', message_id)
            );

            if (!messageResult.success) {
                return { success: false, error: 'Message not found' };
            }

            const message = messageResult.data;

            // Emit status update to sender
            this.server.to(`user:${message.sender_id}`).emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATED, {
                message_id,
                status: MessageStatus.DELIVERED,
                delivered_at,
            });

            // TODO: Update message status in database
            // await this.chatsService.send('messages.update_status', {
            //     message_id,
            //     status: 'delivered',
            //     delivered_at,
            // });

            return { success: true };
        } catch (error) {
            this.logger.error('Error handling message delivered:', error);
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
            const { conversation_id, user_id, last_read_message_id, read_at } = readDto;

            this.logger.log(
                `User ${user_id} read up to message ${last_read_message_id} in conversation ${conversation_id}`
            );

            // Get conversation to find the other user
            const conversation = await firstValueFrom(
                this.chatsService.send('conversations.find_one', {
                    id: conversation_id,
                    includeMessages: false,
                })
            );

            if (!conversation.success) {
                return { success: false, error: 'Conversation not found' };
            }

            const conversationData = conversation.data;
            const otherUserId = conversationData.sender_id === user_id
                ? conversationData.receiver_id
                : conversationData.sender_id;

            // Emit status update to the other user
            this.server.to(`user:${otherUserId}`).emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATED, {
                conversation_id,
                last_read_message_id,
                status: MessageStatus.READ,
                read_at,
                read_by: user_id,
            });

            // TODO: Update all messages up to last_read_message_id in database
            // await this.chatsService.send('messages.mark_as_read', {
            //     conversation_id,
            //     last_read_message_id,
            //     user_id,
            //     read_at,
            // });

            return { success: true };
        } catch (error) {
            this.logger.error('Error handling message read:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle presence update request
     */
    @SubscribeMessage(SOCKET_EVENTS.PRESENCE_UPDATE)
    async handlePresenceUpdate(
        @MessageBody() data: { user_id: number; status: string; last_seen?: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const { user_id, status } = data;

            await this.presenceService.updateStatus(user_id, status as any);

            // Broadcast to all clients
            this.server.emit(SOCKET_EVENTS.USER_PRESENCE, {
                user_id,
                status,
                last_seen: data.last_seen || new Date().toISOString(),
            });

            return { success: true };
        } catch (error) {
            this.logger.error('Error updating presence:', error);
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

            const presenceMap = await this.presenceService.getMultiplePresence(user_ids);
            const presenceList = Array.from(presenceMap.values());

            client.emit(SOCKET_EVENTS.PRESENCE_LIST, presenceList);

            return { success: true };
        } catch (error) {
            this.logger.error('Error requesting presence:', error);
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
}
