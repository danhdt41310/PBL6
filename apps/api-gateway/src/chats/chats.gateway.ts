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
    }

    /**
     * Handle new client connections
     */
    async handleConnection(client: Socket) {
        try {
            // Extract userId from query params or auth token
            const userId = client.handshake.query.userId as string;

            if (!userId) {
                this.logger.warn(`Client ${client.id} connected without userId`);
                return;
            }

            const userIdNum = parseInt(userId, 10);

            // Store socket connection for this user
            if (!this.userSockets.has(userIdNum)) {
                this.userSockets.set(userIdNum, new Set());
            }
            this.userSockets.get(userIdNum).add(client.id);

            this.logger.log(`Client connected: ${client.id}, User: ${userIdNum}`);

            // Join user to their personal room
            client.join(`user:${userIdNum}`);

            // Mark user as online in Redis
            await this.presenceService.setOnline(userIdNum);

            // Notify all clients that user is online
            this.server.emit(SOCKET_EVENTS.USER_ONLINE, {
                user_id: userIdNum,
                status: 'online',
                last_seen: new Date().toISOString(),
            });
        } catch (error) {
            this.logger.error('Connection error:', error);
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
     * Handle sending a message
     * Validates, saves to DB via microservice, and emits to recipients
     */
    @SubscribeMessage(SOCKET_EVENTS.SEND_MESSAGE)
    @UsePipes(new ValidationPipe({ transform: true }))
    async handleSendMessage(
        @MessageBody() sendMessageDto: SendMessageDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            this.logger.log('Received message:', sendMessageDto);

            // Extract authenticated userId from socket
            const authenticatedUserId = parseInt(client.handshake.query.userId as string, 10);

            // Security: Verify sender_id matches authenticated user
            if (sendMessageDto.sender_id !== authenticatedUserId) {
                client.emit(SOCKET_EVENTS.MESSAGE_ERROR, {
                    message: 'Unauthorized: sender_id does not match authenticated user',
                    code: 'UNAUTHORIZED',
                    details: { client_id: sendMessageDto.client_id },
                });
                return;
            }

            // Convert DTO to CreateMessageDto for service
            const createMessageDto: CreateMessageDto = {
                sender_id: sendMessageDto.sender_id,
                conversation_id: sendMessageDto.conversation_id,
                content: sendMessageDto.content,
                message_type: sendMessageDto.message_type as any || 'text' as any,
            };

            // Send message to chats-service via RPC
            const result = await firstValueFrom(
                this.chatsService.send('messages.create', createMessageDto)
            );

            if (!result.success) {
                // Emit error to sender
                client.emit(SOCKET_EVENTS.MESSAGE_ERROR, {
                    message: result.message || 'Failed to send message',
                    code: 'SEND_FAILED',
                    details: { client_id: sendMessageDto.client_id },
                });
                return;
            }

            const message = result.data;

            // Get conversation details to find recipient
            const conversation = await firstValueFrom(
                this.chatsService.send('conversations.find_one', {
                    id: sendMessageDto.conversation_id,
                    includeMessages: false,
                })
            );

            if (!conversation.success) {
                client.emit(SOCKET_EVENTS.MESSAGE_ERROR, {
                    message: 'Conversation not found',
                    code: 'CONVERSATION_NOT_FOUND',
                    details: { client_id: sendMessageDto.client_id },
                });
                return;
            }

            const conversationData = conversation.data;

            // Determine recipient (the other user in the conversation)
            const recipientId = conversationData.sender_id === sendMessageDto.sender_id
                ? conversationData.receiver_id
                : conversationData.sender_id;

            // Prepare message response
            const messageResponse = {
                ...message,
                client_id: sendMessageDto.client_id,
                status: MessageStatus.SENT,
                conversation: conversationData,
            };

            // Emit to conversation room (for multi-device support)
            this.server
                .to(`conversation:${sendMessageDto.conversation_id}`)
                .emit(SOCKET_EVENTS.MESSAGE_RECEIVED, messageResponse);

            // Emit directly to recipient's personal room
            this.server
                .to(`user:${recipientId}`)
                .emit(SOCKET_EVENTS.MESSAGE_RECEIVED, messageResponse);

            // Confirm to sender with MESSAGE_SENT event
            client.emit(SOCKET_EVENTS.MESSAGE_SENT, messageResponse);

            this.logger.log(`Message sent: ${message.id} from user ${sendMessageDto.sender_id}`);

            return {
                success: true,
                data: message,
            };
        } catch (error) {
            this.logger.error('Error sending message:', error);

            client.emit(SOCKET_EVENTS.MESSAGE_ERROR, {
                message: error.message || 'Failed to send message',
                code: 'INTERNAL_ERROR',
                details: { client_id: sendMessageDto.client_id },
            });

            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Handle user joining a conversation room
     */
    @SubscribeMessage(SOCKET_EVENTS.JOIN_CONVERSATION)
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
                })
            );

            if (!conversation.success) {
                client.emit(SOCKET_EVENTS.ERROR, { message: 'Conversation not found' });
                return;
            }

            const conversationData = conversation.data;

            // Check if user is part of conversation
            if (conversationData.sender_id !== user_id && conversationData.receiver_id !== user_id) {
                client.emit(SOCKET_EVENTS.ERROR, { message: 'Unauthorized to join this conversation' });
                return;
            }

            // Join conversation room
            client.join(`conversation:${conversation_id}`);

            this.logger.log(`User ${user_id} joined conversation ${conversation_id}`);

            // Get online participants
            const otherUserId = conversationData.sender_id === user_id
                ? conversationData.receiver_id
                : conversationData.sender_id;

            const onlineParticipants = [];
            if (this.userSockets.has(user_id)) onlineParticipants.push(user_id);
            if (this.userSockets.has(otherUserId)) onlineParticipants.push(otherUserId);

            client.emit(SOCKET_EVENTS.CONVERSATION_JOINED, {
                conversation_id,
                success: true,
                participants: [conversationData.sender_id, conversationData.receiver_id],
                online_participants: onlineParticipants,
            });

            return {
                success: true,
                conversation_id,
            };
        } catch (error) {
            this.logger.error('Error joining conversation:', error);
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
