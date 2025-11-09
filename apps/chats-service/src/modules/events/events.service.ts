import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

/**
 * Service for emitting real-time events via Redis Pub/Sub
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(@Inject('REDIS_PUBSUB') private redisClient: ClientProxy) {}

  /**
   * Emit a message created event
   * @param conversationId - ID of the conversation
   * @param message - Complete message data with relations
   */
  async emitMessageCreated(conversationId: number, message: any) {
    try {
      const channel = `chat:conversation:${conversationId}`;

      this.logger.log(`Emitting message to channel: ${channel}`);

      // Publish message to Redis channel
      this.redisClient.emit(channel, {
        event: 'message:created',
        data: message,
        timestamp: new Date(),
      });

      // Also emit to general message stream
      this.redisClient.emit('chat:messages', {
        event: 'message:created',
        conversationId,
        data: message,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to emit message created event:', error);
    }
  }

  /**
   * Emit a message updated event
   */
  async emitMessageUpdated(conversationId: number, message: any) {
    try {
      const channel = `chat:conversation:${conversationId}`;

      this.redisClient.emit(channel, {
        event: 'message:updated',
        data: message,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to emit message updated event:', error);
    }
  }

  /**
   * Emit a message deleted event
   */
  async emitMessageDeleted(conversationId: number, messageId: number) {
    try {
      const channel = `chat:conversation:${conversationId}`;

      this.redisClient.emit(channel, {
        event: 'message:deleted',
        data: { messageId },
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to emit message deleted event:', error);
    }
  }

  /**
   * Emit typing indicator
   */
  async emitTyping(conversationId: number, userId: number, isTyping: boolean) {
    try {
      const channel = `chat:conversation:${conversationId}`;

      this.redisClient.emit(channel, {
        event: 'user:typing',
        data: {
          userId,
          isTyping,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to emit typing event:', error);
    }
  }

  /**
   * Emit conversation created event
   */
  async emitConversationCreated(conversation: any) {
    try {
      this.redisClient.emit('chat:conversations', {
        event: 'conversation:created',
        data: conversation,
        timestamp: new Date(),
      });

      // Emit to both users
      this.redisClient.emit(`chat:user:${conversation.sender_id}`, {
        event: 'conversation:created',
        data: conversation,
        timestamp: new Date(),
      });

      this.redisClient.emit(`chat:user:${conversation.receiver_id}`, {
        event: 'conversation:created',
        data: conversation,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to emit conversation created event:', error);
    }
  }

  /**
   * Emit messages marked as read event
   */
  async emitMessagesRead(
    conversationId: number,
    userId: number,
    count: number,
  ) {
    try {
      const channel = `chat:conversation:${conversationId}`;

      this.redisClient.emit(channel, {
        event: 'messages:read',
        data: {
          userId,
          count,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to emit messages read event:', error);
    }
  }
}
