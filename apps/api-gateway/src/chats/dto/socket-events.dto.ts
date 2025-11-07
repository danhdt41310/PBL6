import { IsNotEmpty, IsNumber, IsString, IsBoolean, IsEnum, IsOptional, IsDateString } from 'class-validator';

/**
 * Message Status Enum
 */
export enum MessageStatus {
    SENDING = 'sending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    FAILED = 'failed',
}

/**
 * Message Type Enum
 */
export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file',
}

/**
 * User Presence Status
 */
export enum PresenceStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
    AWAY = 'away',
}

/**
 * DTO for sending messages
 */
export class SendMessageDto {
    @IsNotEmpty()
    @IsNumber()
    sender_id: number;

    @IsNotEmpty()
    @IsNumber()
    conversation_id: number;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsEnum(MessageType)
    message_type?: MessageType = MessageType.TEXT;

    @IsOptional()
    @IsString()
    client_id?: string; // For optimistic updates

    @IsOptional()
    @IsString()
    reply_to_id?: string; // For message replies
}

/**
 * DTO for message delivered acknowledgment
 */
export class MessageDeliveredDto {
    @IsNotEmpty()
    @IsNumber()
    message_id: number;

    @IsNotEmpty()
    @IsNumber()
    user_id: number;

    @IsNotEmpty()
    @IsDateString()
    delivered_at: string;
}

/**
 * DTO for message read acknowledgment
 */
export class MessageReadDto {
    @IsNotEmpty()
    @IsNumber()
    conversation_id: number;

    @IsNotEmpty()
    @IsNumber()
    user_id: number;

    @IsNotEmpty()
    @IsNumber()
    last_read_message_id: number;

    @IsNotEmpty()
    @IsDateString()
    read_at: string;
}

/**
 * DTO for typing indicator
 */
export class TypingIndicatorDto {
    @IsNotEmpty()
    @IsNumber()
    conversation_id: number;

    @IsNotEmpty()
    @IsNumber()
    user_id: number;

    @IsNotEmpty()
    @IsBoolean()
    is_typing: boolean;
}

/**
 * DTO for joining conversation
 */
export class JoinConversationDto {
    @IsNotEmpty()
    @IsNumber()
    conversation_id: number;

    @IsNotEmpty()
    @IsNumber()
    user_id: number;
}

/**
 * DTO for presence update
 */
export class PresenceUpdateDto {
    @IsNotEmpty()
    @IsNumber()
    user_id: number;

    @IsNotEmpty()
    @IsEnum(PresenceStatus)
    status: PresenceStatus;

    @IsOptional()
    @IsString()
    last_seen?: string;
}

/**
 * Socket Event Names - Type-safe event names
 */
export const SOCKET_EVENTS = {
    // Client -> Server
    SEND_MESSAGE: 'message:send',
    JOIN_CONVERSATION: 'conversation:join',
    LEAVE_CONVERSATION: 'conversation:leave',
    TYPING_START: 'typing:start',
    TYPING_STOP: 'typing:stop',
    MESSAGE_DELIVERED: 'message:delivered',
    MESSAGE_READ: 'message:read',
    PRESENCE_UPDATE: 'presence:update',
    REQUEST_PRESENCE: 'presence:request',

    // Server -> Client
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_SENT: 'message:sent',
    MESSAGE_STATUS_UPDATED: 'message:status',
    MESSAGE_ERROR: 'message:error',
    CONVERSATION_JOINED: 'conversation:joined',
    USER_TYPING: 'user:typing',
    USER_ONLINE: 'user:online',
    USER_OFFLINE: 'user:offline',
    USER_PRESENCE: 'user:presence',
    PRESENCE_LIST: 'presence:list',
    ERROR: 'error',
    RECONNECTED: 'reconnected',
} as const;

/**
 * Response interfaces for type safety
 */
export interface MessageResponse {
    id: number;
    sender_id: number;
    conversation_id: number;
    content: string;
    message_type: MessageType;
    timestamp: string;
    status: MessageStatus;
    client_id?: string;
    reply_to_id?: string;
    edited_at?: string;
}

export interface ConversationJoinedResponse {
    conversation_id: number;
    success: boolean;
    participants: number[];
    online_participants: number[];
}

export interface TypingResponse {
    conversation_id: number;
    user_id: number;
    is_typing: boolean;
    user_name?: string;
}

export interface PresenceResponse {
    user_id: number;
    status: PresenceStatus;
    last_seen?: string;
}

export interface ErrorResponse {
    message: string;
    code?: string;
    details?: any;
}
