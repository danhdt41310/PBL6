# 🚀 Quick Start - Real-time Chat

## Prerequisites

- Docker & Docker Compose running
- Node.js installed
- Databases migrated

## 1. Start Services

```bash
# Start all services with Docker
docker-compose up -d

# Or start individual services
cd apps/api-gateway
npm run start:dev

cd apps/chats-service
npm run start:dev
```

## 2. Verify Services Running

- API Gateway: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs
- WebSocket: ws://localhost:3000/chat

## 3. Create a Conversation (REST API)

### Using Swagger UI
1. Go to http://localhost:3000/api-docs
2. Find **POST /api/chats/conversations**
3. Try it out:
```json
{
  "sender_id": 1,
  "receiver_id": 2
}
```
4. Note the `conversation_id` from response

### Using cURL
```bash
curl -X POST http://localhost:3000/api/chats/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "sender_id": 1,
    "receiver_id": 2
  }'
```

## 4. Test WebSocket Chat

### Option A: HTML Test Client (Recommended)

1. Open file: `apps/api-gateway/test/websocket-test.html` in browser
2. Configure:
   - Server URL: `http://localhost:3000`
   - User ID: `1`
3. Click **Connect**
4. Enter Conversation ID (from step 3)
5. Click **Join**
6. Type a message and click **Send Message**

### Option B: Browser Console

```javascript
// 1. Connect
const socket = io('http://localhost:3000/chat', {
  query: { userId: 1 }
});

// 2. Handle events
socket.on('connect', () => {
  console.log('✅ Connected!');
});

socket.on('receive-message', (data) => {
  console.log('📨 Message:', data);
});

socket.on('message-sent', (data) => {
  console.log('✅ Sent:', data);
});

socket.on('message-error', (err) => {
  console.error('❌ Error:', err);
});

// 3. Join conversation
socket.emit('join-conversation', {
  conversationId: 1,
  userId: 1
});

// 4. Send message
socket.emit('send-message', {
  sender_id: 1,
  conversation_id: 1,
  message_type: 'text',
  content: 'Hello from browser console!'
});
```

## 5. Test with Multiple Users

### Window 1 (User 1):
```javascript
const socket1 = io('http://localhost:3000/chat', { query: { userId: 1 } });
socket1.on('connect', () => {
  socket1.emit('join-conversation', { conversationId: 1, userId: 1 });
});
socket1.on('receive-message', msg => console.log('User 1 received:', msg));
```

### Window 2 (User 2):
```javascript
const socket2 = io('http://localhost:3000/chat', { query: { userId: 2 } });
socket2.on('connect', () => {
  socket2.emit('join-conversation', { conversationId: 1, userId: 2 });
});
socket2.on('receive-message', msg => console.log('User 2 received:', msg));
```

### Send from User 1:
```javascript
socket1.emit('send-message', {
  sender_id: 1,
  conversation_id: 1,
  message_type: 'text',
  content: 'Hi User 2!'
});
// User 2 will receive this message in real-time!
```

## 6. Test Typing Indicators

```javascript
// Start typing
socket.emit('typing', {
  conversationId: 1,
  userId: 1,
  isTyping: true
});

// Stop typing after 2 seconds
setTimeout(() => {
  socket.emit('typing', {
    conversationId: 1,
    userId: 1,
    isTyping: false
  });
}, 2000);
```

## 7. View Message History (REST API)

```bash
# Get messages in conversation
curl http://localhost:3000/api/chats/conversations/1/messages?page=1&limit=20
```

Or in Swagger UI:
- **GET /api/chats/conversations/{conversationId}/messages**

## Common Issues

### ❌ Connection Failed
**Error:** Can't connect to WebSocket

**Solutions:**
- Check API Gateway is running on port 3000
- Verify CORS settings allow your origin
- Ensure you're using correct URL: `http://localhost:3000`

### ❌ Validation Error
**Error:** `sender_id should not be empty`

**Solutions:**
- Send numbers as numbers, NOT strings:
  ```javascript
  // ✅ Correct
  { sender_id: 1 }
  
  // ❌ Wrong
  { sender_id: "1" }
  ```

### ❌ Conversation Not Found
**Error:** `Conversation not found`

**Solutions:**
- Create conversation first using REST API
- Use correct conversation_id
- Verify conversation exists in database

### ❌ Messages Not Received
**Problem:** Sent message but other user didn't receive

**Solutions:**
- Both users must join the conversation first
- Check both sockets are connected
- Verify conversation_id is correct

## Testing Checklist

- [ ] API Gateway running (port 3000)
- [ ] Chats Service running
- [ ] Redis running
- [ ] PostgreSQL running
- [ ] Conversation created via REST API
- [ ] WebSocket connected successfully
- [ ] Joined conversation room
- [ ] Can send messages
- [ ] Can receive messages
- [ ] Typing indicators work
- [ ] Multiple users can chat

## Next Steps

- Read full documentation: `WEBSOCKET_GUIDE.md`
- Explore REST API: http://localhost:3000/api-docs
- Check implementation: `REALTIME_CHAT_SUMMARY.md`

## Support

- **WebSocket Events:** See `WEBSOCKET_GUIDE.md`
- **REST API:** See `SWAGGER_GUIDE.md`
- **Architecture:** See `REALTIME_CHAT_SUMMARY.md`

---

**🎉 Happy Chatting!**
