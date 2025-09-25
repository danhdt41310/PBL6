# Chats Service

A NestJS microservice for managing chat messages and conversations in the PBL6 application.

## Features

- Message management (create, read, update, delete)
- Conversation management
- Support for different message types (text, file, image)
- PostgreSQL database with TypeORM
- Redis microservice communication
- Hot reload in development mode

## Database Schema

### Messages Table
- `id` (Primary Key)
- `sender_id` (Foreign Key to users)
- `conversation_id` (Foreign Key to conversations)
- `timestamp` (Message timestamp, default: now())
- `message_type` (text/file/image, default: text)
- `content` (Message content)

### Conversations Table
- `id` (Primary Key)
- `sender_id` (Sender identifier)
- `receiver_id` (Receiver identifier, unique)

## API Messages (Redis)

### Messages
- `get_messages_hello` - Test message
- `create_message` - Create a new message
- `get_all_messages` - Get all messages
- `get_message_by_id` - Get message by ID
- `get_messages_by_conversation` - Get messages for a conversation
- `get_messages_by_sender` - Get messages by sender
- `update_message` - Update a message
- `delete_message` - Delete a message

### Conversations
- `get_conversations_hello` - Test message
- `create_conversation` - Create a new conversation
- `get_all_conversations` - Get all conversations
- `get_conversation_by_id` - Get conversation by ID
- `get_conversations_by_sender` - Get conversations by sender
- `get_conversations_by_receiver` - Get conversations by receiver
- `update_conversation` - Update a conversation
- `delete_conversation` - Delete a conversation

## Environment Variables

- `DATABASE_HOST` - PostgreSQL host (default: localhost)
- `DATABASE_PORT` - PostgreSQL port (default: 5432)
- `DATABASE_NAME` - Database name (default: chats_db)
- `DATABASE_USER` - Database user (default: postgres)
- `DATABASE_PASSWORD` - Database password (default: postgres123)
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `PORT` - Service port (default: 3005)

## Running the Service

### Development
```bash
npm run start:dev --workspace=chats-service
```

### Production
```bash
npm run build --workspace=chats-service
npm run start:prod --workspace=chats-service
```

### Docker
```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up chats-service

# Production
docker-compose up chats-service
```
