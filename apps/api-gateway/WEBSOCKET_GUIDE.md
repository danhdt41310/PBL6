# WebSocket Chat API Documentation

## Overview

Real-time chat functionality using Socket.IO WebSocket connections.

## Connection

### Endpoint
```
ws://localhost:3000/chat
```

### Connection Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | number | Yes | ID of the user connecting |

### Example Connection (JavaScript)
```javascript
const socket = io('http://localhost:3000/chat', {
  query: { userId: 1 },
  transports: ['websocket', 'polling']
});
```

## Events

### Client → Server Events

#### 1. `send-message`
Send a new message to a conversation.

**Payload:**
```typescript
{
  sender_id: number;
  conversation_id: number;
  message_type: 'text' | 'image' | 'file';
  content: string;
}
```

**Example:**
```javascript
socket.emit('send-message', {
  sender_id: 1,
  conversation_id: 1,
  message_type: 'text',
  content: 'Hello, how are you?'
});
```

**Response Events:**
- `message-sent` - Confirmation message was saved
- `message-error` - Error occurred
- `receive-message` - Broadcast to conversation participants

---

#### 2. `join-conversation`
Join a conversation room to receive real-time messages.

**Payload:**
```typescript
{
  conversationId: number;
  userId: number;
}
```

**Example:**
```javascript
socket.emit('join-conversation', {
  conversationId: 1,
  userId: 1
});
```

**Response:**
```typescript
{
  success: boolean;
  conversationId: number;
}
```

---

#### 3. `leave-conversation`
Leave a conversation room.

**Payload:**
```typescript
{
  conversationId: number;
}
```

**Example:**
```javascript
socket.emit('leave-conversation', {
  conversationId: 1
});
```

---

#### 4. `typing`
Send typing indicator to conversation.

**Payload:**
```typescript
{
  conversationId: number;
  userId: number;
  isTyping: boolean;
}
```

**Example:**
```javascript
socket.emit('typing', {
  conversationId: 1,
  userId: 1,
  isTyping: true
});
```

---

### Server → Client Events

#### 1. `receive-message`
Receive a new message in a conversation.

**Payload:**
```typescript
{
  id: number;
  sender_id: number;
  conversation_id: number;
  timestamp: Date;
  message_type: 'text' | 'image' | 'file';
  content: string;
  conversation: {
    id: number;
    sender_id: number;
    receiver_id: number;
  };
}
```

**Example Handler:**
```javascript
socket.on('receive-message', (data) => {
  console.log('New message:', data);
  // Update UI with new message
});
```

---

#### 2. `message-sent`
Confirmation that your message was successfully saved.

**Payload:** Same as `receive-message`

---

#### 3. `message-error`
Error occurred while sending message.

**Payload:**
```typescript
{
  error: string;
}
```

**Example Handler:**
```javascript
socket.on('message-error', (data) => {
  console.error('Message error:', data.error);
  alert(data.error);
});
```

---

#### 4. `joined-conversation`
Confirmation of joining a conversation.

**Payload:**
```typescript
{
  conversationId: number;
  success: boolean;
}
```

---

#### 5. `user-typing`
Typing indicator from another user.

**Payload:**
```typescript
{
  conversationId: number;
  userId: number;
  isTyping: boolean;
}
```

**Example Handler:**
```javascript
socket.on('user-typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.userId);
  } else {
    hideTypingIndicator(data.userId);
  }
});
```

---

#### 6. `user:online`
A user came online.

**Payload:**
```typescript
{
  userId: number;
}
```

---

#### 7. `user:offline`
A user went offline.

**Payload:**
```typescript
{
  userId: number;
}
```

---

#### 8. `error`
General error message.

**Payload:**
```typescript
{
  message: string;
}
```

---

## Connection Lifecycle

### 1. Connect
```javascript
const socket = io('http://localhost:3000/chat', {
  query: { userId: 1 }
});

socket.on('connect', () => {
  console.log('Connected to chat server');
});
```

### 2. Join Conversation
```javascript
socket.emit('join-conversation', {
  conversationId: 1,
  userId: 1
});

socket.on('joined-conversation', (data) => {
  console.log('Joined conversation:', data.conversationId);
});
```

### 3. Send/Receive Messages
```javascript
// Send
socket.emit('send-message', {
  sender_id: 1,
  conversation_id: 1,
  message_type: 'text',
  content: 'Hello!'
});

// Receive
socket.on('receive-message', (data) => {
  displayMessage(data);
});
```

### 4. Handle Typing
```javascript
// Start typing
socket.emit('typing', {
  conversationId: 1,
  userId: 1,
  isTyping: true
});

// Listen for others typing
socket.on('user-typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.userId);
  }
});
```

### 5. Disconnect
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});
```

---

## Room Structure

### User Rooms
Each user automatically joins a personal room when connecting:
- Format: `user:{userId}`
- Example: `user:1`

### Conversation Rooms
Users join conversation rooms to receive messages:
- Format: `conversation:{conversationId}`
- Example: `conversation:1`

---

## Error Handling

### Common Errors

1. **Connection without userId**
   - Error: Client connects without userId query parameter
   - Solution: Always include userId in connection query

2. **Message validation failed**
   - Error: `sender_id should not be empty, sender_id must be an integer number`
   - Solution: Ensure all fields are properly formatted (numbers as numbers, not strings)

3. **Conversation not found**
   - Error: `Conversation not found`
   - Solution: Create conversation first via REST API

4. **Unauthorized conversation access**
   - Error: `Unauthorized to join this conversation`
   - Solution: Only join conversations where you are sender or receiver

---

## Complete Example

```javascript
// Initialize connection
const socket = io('http://localhost:3000/chat', {
  query: { userId: 1 }
});

// Connection handlers
socket.on('connect', () => {
  console.log('✅ Connected to chat server');
  
  // Join conversation
  socket.emit('join-conversation', {
    conversationId: 1,
    userId: 1
  });
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from chat server');
});

// Join conversation confirmation
socket.on('joined-conversation', (data) => {
  console.log('📥 Joined conversation:', data.conversationId);
});

// Receive messages
socket.on('receive-message', (data) => {
  console.log('📨 New message:', data);
  addMessageToUI(data);
});

// Message sent confirmation
socket.on('message-sent', (data) => {
  console.log('✅ Message sent successfully:', data);
});

// Error handling
socket.on('message-error', (data) => {
  console.error('❌ Message error:', data.error);
  alert(data.error);
});

socket.on('error', (data) => {
  console.error('❌ Error:', data.message);
});

// Typing indicators
socket.on('user-typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(`User ${data.userId} is typing...`);
  } else {
    hideTypingIndicator();
  }
});

// User presence
socket.on('user:online', (data) => {
  updateUserStatus(data.userId, 'online');
});

socket.on('user:offline', (data) => {
  updateUserStatus(data.userId, 'offline');
});

// Send a message
function sendMessage(content) {
  socket.emit('send-message', {
    sender_id: 1,
    conversation_id: 1,
    message_type: 'text',
    content: content
  });
}

// Send typing indicator
function setTyping(isTyping) {
  socket.emit('typing', {
    conversationId: 1,
    userId: 1,
    isTyping: isTyping
  });
}

// Usage
sendMessage('Hello, World!');
setTyping(true);  // Start typing
setTimeout(() => setTyping(false), 1000);  // Stop typing after 1s
```

---

## Testing

### Using the Test Client

1. Open `test/websocket-test.html` in your browser
2. Enter server URL (default: http://localhost:3000)
3. Enter your User ID
4. Click "Connect"
5. Enter Conversation ID
6. Click "Join"
7. Type a message and click "Send Message"

### Using Browser Console

```javascript
// Connect
const socket = io('http://localhost:3000/chat', { query: { userId: 1 } });

// Join conversation
socket.emit('join-conversation', { conversationId: 1, userId: 1 });

// Send message
socket.emit('send-message', {
  sender_id: 1,
  conversation_id: 1,
  message_type: 'text',
  content: 'Test message'
});

// Listen for responses
socket.on('receive-message', console.log);
socket.on('message-sent', console.log);
socket.on('message-error', console.error);
```

---

## Integration with REST API

### 1. Create a Conversation (REST)
```bash
POST /api/chats/conversations
{
  "sender_id": 1,
  "receiver_id": 2
}
```

### 2. Connect to WebSocket
```javascript
const socket = io('http://localhost:3000/chat', { query: { userId: 1 } });
```

### 3. Join the Conversation
```javascript
socket.emit('join-conversation', { conversationId: 1, userId: 1 });
```

### 4. Send Real-time Messages
```javascript
socket.emit('send-message', {
  sender_id: 1,
  conversation_id: 1,
  message_type: 'text',
  content: 'Hello!'
});
```

### 5. Fetch Message History (REST)
```bash
GET /api/chats/conversations/1/messages?page=1&limit=20
```

---

## Architecture

```
┌─────────────┐
│   Client    │
│ (Browser)   │
└──────┬──────┘
       │ WebSocket
       │ /chat?userId=1
       ▼
┌─────────────────┐
│  API Gateway    │
│ ChatsGateway    │
└────────┬────────┘
         │ RPC (Redis)
         ▼
┌─────────────────┐      ┌──────────┐
│  Chats Service  │─────▶│   DB     │
│ MessagesService │      │ Postgres │
└────────┬────────┘      └──────────┘
         │
         │ Redis Pub/Sub
         ▼
┌─────────────────┐
│ EventsService   │
│ (Real-time)     │
└─────────────────┘
```

---

## Best Practices

1. **Always validate userId on connection**
2. **Join conversation rooms before sending messages**
3. **Handle all error events**
4. **Implement reconnection logic**
5. **Debounce typing indicators**
6. **Clean up event listeners on disconnect**
7. **Use room-based messaging for scalability**
8. **Implement message delivery confirmation**

---

## Troubleshooting

### Connection Issues
- Check CORS settings
- Verify server is running on correct port
- Ensure userId is provided in query params

### Message Not Received
- Verify you've joined the conversation room
- Check conversation exists in database
- Verify sender_id and conversation_id are correct

### Typing Indicators Not Working
- Ensure isTyping is boolean, not string
- Verify you're in the conversation room
- Check conversationId matches

---

## Performance Considerations

- Messages are saved to database before broadcasting
- Use rooms to limit message broadcasts
- Redis is used for pub/sub between service instances
- Connection state is stored in memory (Map)
- Consider implementing message queuing for high traffic

---

## Security

- Implement authentication via JWT tokens
- Validate user permissions for conversations
- Sanitize message content
- Rate limit message sending
- Implement message encryption for sensitive data

---

For more information, see:
- [REST API Documentation](../SWAGGER_GUIDE.md)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
