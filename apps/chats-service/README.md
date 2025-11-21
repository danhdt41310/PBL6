# Chats Service

A NestJS microservice for managing chat messages and conversations in the PBL6 application.

## 📋 Overview

This service handles:
- ✅ **Messages**: Full CRUD operations with Prisma ORM
- ✅ **Conversations**: Bidirectional conversation management between users
- ✅ **Validation**: DTOs with class-validator and Swagger documentation
- ✅ **Error Handling**: Comprehensive Prisma error mapping to HTTP exceptions
- ✅ **Microservice Patterns**: Redis-based communication with API Gateway
- ✅ **REST API**: Complete REST endpoints via API Gateway

## 🗄️ Database Schema

### Conversation Model
```prisma
model Conversation {
  id          Int       @id @default(autoincrement())
  sender_id   Int
  receiver_id Int
  messages    Message[]

  @@unique([sender_id, receiver_id])
  @@map("conversations")
}
```

### Message Model
```prisma
model Message {
  id              Int         @id @default(autoincrement())
  sender_id       Int
  conversation_id Int
  timestamp       DateTime    @default(now()) @db.Timestamp(6)
  message_type    MessageType @default(text)
  content         String?     @db.Text
  
  conversation    Conversation @relation(fields: [conversation_id], references: [id], onDelete: Cascade)

  @@map("messages")
}

enum MessageType {
  text
  file
  image
}
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd apps/chats-service
npm install
```

### 2. Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 3. Configure Environment
```env
CHATS_DATABASE_URL="postgresql://user:password@localhost:5432/chats_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3005
```

### 4. Start Service
```bash
# Development (with hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod

# Docker
docker-compose -f docker-compose.dev.yml up chats-service
```

## 📡 API Endpoints

### Messages
```http
POST   /chats/messages                          # Create message
GET    /chats/messages/:id                      # Get message by ID
GET    /chats/conversations/:id/messages        # Get messages in conversation
GET    /chats/users/:userId/messages            # Get all user messages
PUT    /chats/messages/:id                      # Update message
DELETE /chats/messages/:id                      # Delete message
```

### Conversations
```http
POST   /chats/conversations                     # Create conversation
GET    /chats/conversations/:id                 # Get conversation
GET    /chats/users/:userId/conversations       # Get user conversations
GET    /chats/conversations/between/:u1/:u2     # Find by users
DELETE /chats/conversations/:id                 # Delete conversation
GET    /chats/users/:userId/conversations/stats # Get stats
```

## 📝 Usage Examples

### Create Conversation & Send Message
```bash
# 1. Create conversation
curl -X POST http://localhost:3000/chats/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sender_id": 1, "receiver_id": 2}'

# 2. Send message
curl -X POST http://localhost:3000/chats/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sender_id": 1,
    "conversation_id": 1,
    "message_type": "text",
    "content": "Hello, how are you?"
  }'

# 3. Get messages with pagination
curl "http://localhost:3000/chats/conversations/1/messages?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Key Features

### 1. Bidirectional Conversation Logic
The service automatically handles bidirectional conversation searches. When creating or finding a conversation, it checks both directions:

```typescript
// Finds conversation between user 1 and 2, regardless of who is sender/receiver
where: {
  OR: [
    { sender_id: 1, receiver_id: 2 },
    { sender_id: 2, receiver_id: 1 },
  ],
}
```

### 2. Prisma Error Handling
All Prisma errors are properly mapped to HTTP exceptions:

| Prisma Code | HTTP Status | Description |
|-------------|-------------|-------------|
| P2002 | 400 Bad Request | Unique constraint violation |
| P2025 | 404 Not Found | Record not found |
| P2003 | 400 Bad Request | Foreign key constraint violation |

### 3. Cascade Delete
When a conversation is deleted, all associated messages are automatically deleted due to the `onDelete: Cascade` relationship.

### 4. Include Relations
All responses include relevant relations:
- Messages include conversation details
- Conversations include last message

## 📚 Documentation

Comprehensive documentation is available:

- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Complete implementation details with code examples
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference for message patterns and endpoints
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[SUMMARY.md](./SUMMARY.md)** - Implementation summary and checklist

## 🎯 Microservice Message Patterns

### Messages

| Pattern | Description |
|---------|-------------|
| `messages.create` | Create a new message |
| `messages.find_by_conversation` | Get messages in conversation (paginated) |
| `messages.find_one` | Get single message by ID |
| `messages.update` | Update message content/type |
| `messages.delete` | Delete message |
| `messages.find_by_user` | Get all user messages (paginated) |

### Conversations

| Pattern | Description |
|---------|-------------|
| `conversations.create` | Create or return existing conversation |
| `conversations.find_one` | Get conversation by ID |
| `conversations.find_by_users` | Find conversation between 2 users |
| `conversations.find_by_user` | Get user's conversations (paginated) |
| `conversations.delete` | Delete conversation (cascade) |
| `conversations.stats` | Get user conversation statistics |

## 🏗️ Architecture

```
chats-service/
├── src/
│   ├── modules/
│   │   ├── messages/
│   │   │   ├── dto/
│   │   │   │   └── message.dto.ts         # DTOs with validation
│   │   │   ├── messages.controller.ts     # Message patterns
│   │   │   ├── messages.service.ts        # Business logic
│   │   │   └── messages.module.ts
│   │   └── conversations/
│   │       ├── dto/
│   │       │   └── conversation.dto.ts
│   │       ├── conversations.controller.ts
│   │       ├── conversations.service.ts
│   │       └── conversations.module.ts
│   ├── prisma/
│   │   └── prisma.service.ts
│   └── app.module.ts
└── prisma/
    └── schema.prisma
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing
Access Swagger documentation at: `http://localhost:3000/api`

## 🔍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CHATS_DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `PORT` | Service port | `3005` |

## 📊 Service Health

Check service health:
```bash
# Test connection
curl http://localhost:3000/chats/hello

# Expected response
"Hello from Chats Service!"
```

## 🐛 Troubleshooting

Common issues and solutions:

1. **Prisma Client Not Found**
   ```bash
   npx prisma generate
   ```

2. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify connection string in `.env`

3. **Redis Connection Error**
   - Ensure Redis is running: `redis-cli ping`
   - Check REDIS_HOST and REDIS_PORT

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is part of the PBL6 application.

## 👥 Team

PBL6 Development Team

---

**Version**: 1.0.0  
**Last Updated**: November 5, 2025

For detailed implementation information, see [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
