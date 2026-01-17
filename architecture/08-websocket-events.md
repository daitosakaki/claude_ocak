# WebSocket Events

## Bağlantı Bilgileri

| Property | Value |
|----------|-------|
| URL (Prod) | `wss://api.superapp.com/socket` |
| URL (Staging) | `wss://api-staging.superapp.com/socket` |
| Protocol | Socket.IO v4 |
| Transport | WebSocket (primary), Polling (fallback) |
| Ping Interval | 25 seconds |
| Ping Timeout | 20 seconds |

---

## Bağlantı Akışı

```
┌─────────────┐                              ┌─────────────┐
│   Client    │                              │   Server    │
└──────┬──────┘                              └──────┬──────┘
       │                                            │
       │ ──────── WebSocket Connect ──────────────► │
       │                                            │
       │ ◄─────────── connected ─────────────────── │
       │                                            │
       │ ──────── authenticate {token} ──────────► │
       │                                            │
       │ ◄──────── authenticated {userId} ──────── │
       │                                            │
       │ ◄─────────── Ready to use ─────────────── │
       │                                            │
```

---

## Authentication

### Client → Server

**Event:** `authenticate`

```javascript
socket.emit('authenticate', {
  token: "eyJhbGciOiJSUzI1NiIs..."  // JWT access token
});
```

### Server → Client

**Event:** `authenticated`

```javascript
{
  userId: "user_123",
  sessionId: "sess_456",
  connectedAt: "2024-01-15T10:00:00Z"
}
```

**Event:** `error` (authentication failed)

```javascript
{
  code: "AUTH_FAILED",
  message: "Invalid or expired token"
}
```

---

## Client → Server Events

### message:send

Yeni mesaj gönderme.

```javascript
socket.emit('message:send', {
  tempId: "temp_uuid_123",           // Client tarafında oluşturulan geçici ID
  conversationId: "conv_456",
  type: "text",                      // text | image | video | voice | file
  encrypted: {
    content: "base64_encrypted_content",
    nonce: "base64_nonce",
    algorithm: "x25519-aes256gcm"
  },
  replyTo: "msg_789"                 // Opsiyonel: yanıtlanan mesaj
});
```

**Media mesajı için:**

```javascript
socket.emit('message:send', {
  tempId: "temp_uuid_123",
  conversationId: "conv_456",
  type: "image",
  encrypted: {
    content: "base64_encrypted_caption",  // Şifreli caption
    nonce: "base64_nonce",
    algorithm: "x25519-aes256gcm"
  },
  media: {
    url: "https://cdn.../image.jpg",      // Şifresiz URL (içerik şifreli)
    thumbnailUrl: "https://cdn.../thumb.jpg",
    mimeType: "image/jpeg",
    size: 245678,
    width: 1080,
    height: 720
  }
});
```

---

### message:delivered

Mesaj iletildi bildirimi.

```javascript
socket.emit('message:delivered', {
  messageId: "msg_789"
});
```

---

### message:read

Mesaj okundu bildirimi.

```javascript
socket.emit('message:read', {
  conversationId: "conv_456",
  messageId: "msg_789"              // Bu mesaja kadar okundu
});
```

---

### typing:start

Yazıyor göstergesi başlat.

```javascript
socket.emit('typing:start', {
  conversationId: "conv_456"
});
```

**Not:** Client tarafında debounce yapılmalı (500ms). Her 2 saniyede bir refresh gönderilmeli (kullanıcı hala yazıyorsa).

---

### typing:stop

Yazıyor göstergesi durdur.

```javascript
socket.emit('typing:stop', {
  conversationId: "conv_456"
});
```

**Not:** Mesaj gönderildiğinde veya input boşaldığında gönderilmeli.

---

### conversation:join

Sohbete katıl (mesajları dinlemeye başla).

```javascript
socket.emit('conversation:join', {
  conversationId: "conv_456"
});
```

---

### conversation:leave

Sohbetten ayrıl.

```javascript
socket.emit('conversation:leave', {
  conversationId: "conv_456"
});
```

---

### presence:update

Durum güncelleme.

```javascript
socket.emit('presence:update', {
  status: "online"                  // online | away | offline
});
```

---

### keys:get

Kullanıcının public key'ini iste.

```javascript
socket.emit('keys:get', {
  userId: "user_789"
});
```

---

### ping

Bağlantı kontrolü (Socket.IO otomatik yapar, manuel gerekirse).

```javascript
socket.emit('ping');
```

---

## Server → Client Events

### authenticated

Kimlik doğrulama başarılı.

```javascript
{
  userId: "user_123",
  sessionId: "sess_456",
  connectedAt: "2024-01-15T10:00:00Z"
}
```

---

### error

Hata bildirimi.

```javascript
{
  code: "AUTH_FAILED" | "RATE_LIMITED" | "INVALID_DATA" | "NOT_PARTICIPANT" | "USER_BLOCKED",
  message: "Error description"
}
```

---

### message:new

Yeni mesaj geldi.

```javascript
{
  id: "msg_new_123",
  conversationId: "conv_456",
  senderId: "user_789",
  type: "text",
  encrypted: {
    content: "base64_encrypted_content",
    nonce: "base64_nonce",
    algorithm: "x25519-aes256gcm"
  },
  senderPublicKey: "base64_public_key",   // Şifre çözmek için
  replyTo: null,
  createdAt: "2024-01-15T10:30:00Z"
}
```

**Media mesajı için:**

```javascript
{
  id: "msg_new_123",
  conversationId: "conv_456",
  senderId: "user_789",
  type: "image",
  encrypted: {
    content: "base64_encrypted_caption",
    nonce: "base64_nonce",
    algorithm: "x25519-aes256gcm"
  },
  media: {
    url: "https://cdn.../image.jpg",
    thumbnailUrl: "https://cdn.../thumb.jpg",
    mimeType: "image/jpeg",
    size: 245678,
    width: 1080,
    height: 720
  },
  senderPublicKey: "base64_public_key",
  createdAt: "2024-01-15T10:30:00Z"
}
```

---

### message:sent

Mesaj başarıyla gönderildi (ACK).

```javascript
{
  tempId: "temp_uuid_123",           // Client'ın gönderdiği geçici ID
  messageId: "msg_new_456",          // Server'ın atadığı gerçek ID
  conversationId: "conv_456",
  sentAt: "2024-01-15T10:30:00Z"
}
```

---

### message:delivered

Mesaj karşı tarafa iletildi.

```javascript
{
  messageId: "msg_456",
  conversationId: "conv_123",
  deliveredTo: "user_789",
  deliveredAt: "2024-01-15T10:30:05Z"
}
```

---

### message:read

Mesaj okundu.

```javascript
{
  conversationId: "conv_123",
  messageId: "msg_456",              // Bu mesaja kadar okundu
  readBy: "user_789",
  readAt: "2024-01-15T10:31:00Z"
}
```

---

### typing:update

Yazıyor durumu güncellendi.

```javascript
{
  conversationId: "conv_456",
  userId: "user_789",
  isTyping: true,
  timestamp: "2024-01-15T10:30:00Z"
}
```

---

### presence:update

Kullanıcı durumu değişti.

```javascript
{
  userId: "user_789",
  status: "online" | "away" | "offline",
  lastSeenAt: "2024-01-15T10:30:00Z"   // offline ise
}
```

---

### keys:response

Public key yanıtı.

```javascript
{
  userId: "user_789",
  keys: [
    {
      publicKey: "base64_public_key",
      deviceId: "device_123",
      deviceName: "iPhone 15 Pro",
      isActive: true
    }
  ]
}
```

---

### conversation:updated

Sohbet güncellendi.

```javascript
{
  conversationId: "conv_456",
  lastMessage: {
    id: "msg_789",
    senderId: "user_123",
    preview: "Hey!",
    type: "text",
    sentAt: "2024-01-15T10:30:00Z"
  },
  unreadCount: 3,
  updatedAt: "2024-01-15T10:30:00Z"
}
```

---

### pong

Ping yanıtı.

```javascript
{
  timestamp: "2024-01-15T10:30:00Z"
}
```

---

## Akış Diyagramları

### Mesaj Gönderme

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Client A   │      │   Server    │      │   MongoDB   │      │  Client B   │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │                    │
       │  message:send      │                    │                    │
       │  {tempId, content} │                    │                    │
       │───────────────────►│                    │                    │
       │                    │                    │                    │
       │                    │  Save message      │                    │
       │                    │───────────────────►│                    │
       │                    │                    │                    │
       │                    │  Saved {messageId} │                    │
       │                    │◄───────────────────│                    │
       │                    │                    │                    │
       │  message:sent      │                    │                    │
       │  {tempId, msgId}   │                    │                    │
       │◄───────────────────│                    │                    │
       │                    │                    │                    │
       │                    │  message:new       │                    │
       │                    │  {msgId, content}  │                    │
       │                    │───────────────────────────────────────►│
       │                    │                    │                    │
       │                    │                    │  message:delivered │
       │                    │◄───────────────────────────────────────│
       │                    │                    │                    │
       │  message:delivered │                    │                    │
       │◄───────────────────│                    │                    │
       │                    │                    │                    │
```

### Typing Indicator

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Client A   │      │   Server    │      │    Redis    │      │  Client B   │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │                    │
       │  typing:start      │                    │                    │
       │  (debounced 500ms) │                    │                    │
       │───────────────────►│                    │                    │
       │                    │                    │                    │
       │                    │  SET typing:conv:A │                    │
       │                    │  TTL 3 seconds     │                    │
       │                    │───────────────────►│                    │
       │                    │                    │                    │
       │                    │  typing:update     │                    │
       │                    │  {isTyping: true}  │                    │
       │                    │───────────────────────────────────────►│
       │                    │                    │                    │
       │  typing:start      │                    │                    │
       │  (refresh 2s)      │                    │                    │
       │───────────────────►│                    │                    │
       │                    │                    │                    │
       │                    │  REFRESH TTL       │                    │
       │                    │───────────────────►│                    │
       │                    │                    │                    │
       │  ... 3s no input   │                    │                    │
       │                    │                    │                    │
       │                    │  TTL EXPIRED       │                    │
       │                    │◄───────────────────│                    │
       │                    │                    │                    │
       │                    │  typing:update     │                    │
       │                    │  {isTyping: false} │                    │
       │                    │───────────────────────────────────────►│
       │                    │                    │                    │
```

### Online Status

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Client    │      │   Server    │      │    Redis    │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       │  WebSocket Connect │                    │
       │───────────────────►│                    │
       │                    │                    │
       │  authenticate      │                    │
       │───────────────────►│                    │
       │                    │                    │
       │                    │  SET online:userId │
       │                    │  TTL 60 seconds    │
       │                    │───────────────────►│
       │                    │                    │
       │  authenticated     │                    │
       │◄───────────────────│                    │
       │                    │                    │
       │  (every 30s ping)  │                    │
       │◄──────────────────►│                    │
       │                    │                    │
       │                    │  REFRESH TTL       │
       │                    │───────────────────►│
       │                    │                    │
       │  disconnect        │                    │
       │───────────────────►│                    │
       │                    │                    │
       │                    │  DEL online:userId │
       │                    │───────────────────►│
       │                    │                    │
       │                    │  Notify contacts   │
       │                    │  presence:update   │
       │                    │  {status: offline} │
       │                    │──────────────────► │
       │                    │                    │
```

### Reconnection

```
┌─────────────┐      ┌─────────────┐
│   Client    │      │   Server    │
└──────┬──────┘      └──────┬──────┘
       │                    │
       │ ═══ Connection Lost ═══
       │                    │
       │  Retry 1 (1s)      │
       │───────────────────X│ (failed)
       │                    │
       │  Retry 2 (2s)      │
       │───────────────────X│ (failed)
       │                    │
       │  Retry 3 (4s)      │
       │───────────────────►│
       │                    │
       │  connected         │
       │◄───────────────────│
       │                    │
       │  authenticate      │
       │───────────────────►│
       │                    │
       │  authenticated     │
       │◄───────────────────│
       │                    │
       │  Sync: GET /conversations/:id/messages?after=lastMsgId
       │───────────────────►│
       │                    │
       │  Missing messages  │
       │◄───────────────────│
       │                    │
       │  Send queued msgs  │
       │───────────────────►│
       │                    │
```

---

## Redis Key Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBSOCKET REDIS KEYS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SOCKET.IO ADAPTER (Multi-instance sync)                        │
│  ───────────────────────────────────────                        │
│  socket.io#/#                       │ Internal adapter keys     │
│                                                                 │
│  ONLINE STATUS                                                  │
│  ─────────────                                                  │
│  Key:    online:{userId}                                        │
│  Type:   Hash                                                   │
│  Value:  { socketId, instanceId, connectedAt }                  │
│  TTL:    60 seconds (refreshed on ping)                         │
│                                                                 │
│  SOCKET MAPPING                                                 │
│  ──────────────                                                 │
│  Key:    socket:{socketId}                                      │
│  Type:   String                                                 │
│  Value:  userId                                                 │
│  TTL:    Session duration                                       │
│                                                                 │
│  TYPING INDICATOR                                               │
│  ────────────────                                               │
│  Key:    typing:{conversationId}:{userId}                       │
│  Type:   String                                                 │
│  Value:  "1"                                                    │
│  TTL:    3 seconds                                              │
│                                                                 │
│  USER CONVERSATIONS (for routing)                               │
│  ────────────────────────────────                               │
│  Key:    user:conversations:{userId}                            │
│  Type:   Set                                                    │
│  Value:  [conversationId1, conversationId2, ...]                │
│  TTL:    5 minutes                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Rate Limits

| Event | Limit | Window | Action on Exceed |
|-------|-------|--------|------------------|
| message:send | 60 | 1 minute | error: RATE_LIMITED |
| typing:start | 20 | 1 minute | Ignore silently |
| keys:get | 30 | 1 minute | error: RATE_LIMITED |
| presence:update | 10 | 1 minute | Ignore silently |

---

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| AUTH_FAILED | Token invalid/expired | Redirect to login |
| AUTH_REQUIRED | Not authenticated | Send authenticate event |
| RATE_LIMITED | Too many requests | Wait and retry |
| INVALID_DATA | Malformed payload | Fix and retry |
| CONVERSATION_NOT_FOUND | Conv doesn't exist | Show error |
| NOT_PARTICIPANT | Not in conversation | Remove from UI |
| USER_BLOCKED | Blocked by recipient | Show blocked message |
| MESSAGE_TOO_LARGE | Content > 16KB | Reduce size |
| MEDIA_INVALID | Invalid media URL | Re-upload |

---

## Flutter Implementation Notes

### Socket Service

```dart
class SocketService {
  late IO.Socket _socket;
  final _messageController = StreamController<Message>.broadcast();
  final _typingController = StreamController<TypingEvent>.broadcast();
  
  Stream<Message> get onMessage => _messageController.stream;
  Stream<TypingEvent> get onTyping => _typingController.stream;
  
  void connect(String token) {
    _socket = IO.io(
      'wss://api.superapp.com/socket',
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .setReconnectionAttempts(10)
        .setReconnectionDelay(1000)
        .setReconnectionDelayMax(30000)
        .build(),
    );
    
    _socket.onConnect((_) {
      _socket.emit('authenticate', {'token': token});
    });
    
    _socket.on('authenticated', (data) {
      // Ready to use
    });
    
    _socket.on('message:new', (data) {
      _messageController.add(Message.fromJson(data));
    });
    
    _socket.on('typing:update', (data) {
      _typingController.add(TypingEvent.fromJson(data));
    });
  }
  
  void sendMessage(String conversationId, String encryptedContent, String nonce) {
    final tempId = Uuid().v4();
    _socket.emit('message:send', {
      'tempId': tempId,
      'conversationId': conversationId,
      'type': 'text',
      'encrypted': {
        'content': encryptedContent,
        'nonce': nonce,
        'algorithm': 'x25519-aes256gcm',
      },
    });
  }
  
  void startTyping(String conversationId) {
    _socket.emit('typing:start', {'conversationId': conversationId});
  }
  
  void stopTyping(String conversationId) {
    _socket.emit('typing:stop', {'conversationId': conversationId});
  }
  
  void disconnect() {
    _socket.disconnect();
  }
}
```

### Typing Debounce

```dart
class TypingHandler {
  Timer? _typingTimer;
  Timer? _refreshTimer;
  bool _isTyping = false;
  final SocketService _socket;
  final String conversationId;
  
  TypingHandler(this._socket, this.conversationId);
  
  void onTextChanged(String text) {
    _typingTimer?.cancel();
    
    if (text.isEmpty) {
      _stopTyping();
      return;
    }
    
    _typingTimer = Timer(Duration(milliseconds: 500), () {
      if (!_isTyping) {
        _isTyping = true;
        _socket.startTyping(conversationId);
        _startRefreshTimer();
      }
    });
  }
  
  void _startRefreshTimer() {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(Duration(seconds: 2), (_) {
      if (_isTyping) {
        _socket.startTyping(conversationId);
      }
    });
  }
  
  void _stopTyping() {
    _isTyping = false;
    _typingTimer?.cancel();
    _refreshTimer?.cancel();
    _socket.stopTyping(conversationId);
  }
  
  void onMessageSent() {
    _stopTyping();
  }
  
  void dispose() {
    _typingTimer?.cancel();
    _refreshTimer?.cancel();
  }
}
```

### Offline Queue

```dart
class MessageQueue {
  final List<PendingMessage> _queue = [];
  final SocketService _socket;
  final Database _db;
  
  Future<void> enqueue(PendingMessage message) async {
    _queue.add(message);
    await _db.insert('pending_messages', message.toMap());
  }
  
  Future<void> processQueue() async {
    final messages = List<PendingMessage>.from(_queue);
    
    for (final message in messages) {
      try {
        _socket.sendMessage(
          message.conversationId,
          message.encryptedContent,
          message.nonce,
        );
        _queue.remove(message);
        await _db.delete('pending_messages', message.tempId);
      } catch (e) {
        // Will retry on next connection
        break;
      }
    }
  }
  
  Future<void> loadFromDb() async {
    final rows = await _db.query('pending_messages');
    _queue.addAll(rows.map((r) => PendingMessage.fromMap(r)));
  }
}
```
