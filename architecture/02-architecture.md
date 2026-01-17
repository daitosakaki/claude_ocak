# Sistem Mimarisi

## Genel Bakış

```
                                 ┌──────────────────┐
                                 │   Flutter Apps   │
                                 │ iOS/Android/Web  │
                                 └────────┬─────────┘
                                          │
                                          │ HTTPS / WSS
                                          ▼
                          ┌───────────────────────────────┐
                          │      Cloud Load Balancer      │
                          │   (SSL Termination, Health)   │
                          └───────────────┬───────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
                    ▼                                           ▼
          ┌─────────────────┐                         ┌─────────────────┐
          │   API Gateway   │                         │ Message Service │
          │   (Cloud Run)   │                         │   (WebSocket)   │
          │                 │                         │   (Cloud Run)   │
          │ • Auth Check    │                         │                 │
          │ • Rate Limit    │                         │ • Socket.IO     │
          │ • Routing       │                         │ • Real-time     │
          │ • Request Log   │                         │ • E2EE Support  │
          └────────┬────────┘                         └────────┬────────┘
                   │                                           │
     ┌─────────────┼─────────────┬─────────────┐              │
     │             │             │             │              │
     ▼             ▼             ▼             ▼              │
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  Auth   │  │  User   │  │  Post   │  │  Feed   │          │
│ Service │  │ Service │  │ Service │  │ Service │          │
└────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘          │
     │             │             │             │              │
     ▼             ▼             ▼             ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│Interact.│  │  Media  │  │ Notif.  │  │ Listing │  │ Dating  │
│ Service │  │ Service │  │ Service │  │ Service │  │ Service │
└────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
     │             │             │             │             │
     └─────────────┴─────────────┴─────────────┴─────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │   MongoDB   │      │    Redis    │      │   Pub/Sub   │
    │    Atlas    │      │ Memorystore │      │   (GCP)     │
    │             │      │             │      │             │
    │ • Users     │      │ • Cache     │      │ • Events    │
    │ • Posts     │      │ • Sessions  │      │ • Async     │
    │ • Messages  │      │ • Online    │      │ • Decouple  │
    │ • Listings  │      │ • Typing    │      │             │
    └─────────────┘      └─────────────┘      └─────────────┘
```

---

## GCP Servisleri

| Servis | Kullanım | Maliyet (MVP) |
|--------|----------|---------------|
| Cloud Run | Microservices hosting | $50-100/ay |
| Cloud Load Balancer | Traffic distribution | $20/ay |
| Memorystore (Redis) | Cache, sessions, real-time | $35/ay |
| Cloud Storage | Media files | $5-10/ay |
| Cloud CDN | Static content delivery | $10/ay |
| Pub/Sub | Event messaging | $5/ay |
| Cloud Build | CI/CD | $0 (free tier) |
| Artifact Registry | Docker images | $5/ay |
| Secret Manager | API keys, credentials | $0 (free tier) |
| Cloud Scheduler | Cron jobs | $0 (free tier) |
| Cloud Armor | WAF, DDoS protection | $10/ay (basic) |
| Identity Platform | OAuth (Google, Apple) | $0 (free tier) |

**MongoDB Atlas**: $57/ay (M10 cluster)

**Toplam MVP**: ~$150-200/ay

---

## Microservices

### Servis Listesi

| Servis | Port | Sorumluluk | Öncelik |
|--------|------|------------|---------|
| api-gateway | 3000 | Routing, auth validation, rate limiting | MVP |
| auth-service | 3001 | Register, login, logout, OAuth, JWT, 2FA | MVP |
| user-service | 3002 | Profile CRUD, follow, block, settings | MVP |
| post-service | 3003 | Post CRUD, poll, hashtag extraction | MVP |
| feed-service | 3004 | Home timeline, explore, trending | MVP |
| interaction-service | 3005 | Like, dislike, comment, repost, bookmark | MVP |
| media-service | 3006 | Upload, resize, thumbnail, video process | MVP |
| message-service | 3007 | WebSocket, conversations, E2EE messages | MVP |
| notification-service | 3008 | FCM push, email, in-app notifications | MVP |
| admin-service | 3011 | Dashboard, moderation, feature flags | MVP |
| listing-service | 3009 | İlan CRUD, categories, search | Faz 2 |
| dating-service | 3010 | Dating profile, discover, swipe, match | Faz 3 |

---

### Servis Detayları

#### api-gateway
```
Sorumluluk:
• JWT token validation
• Request routing to services
• Rate limiting (IP + User based)
• Request/response logging
• CORS handling
• Request transformation

Bağımlılıklar:
• Redis (rate limit counters)
• Auth Service (token validation)
```

#### auth-service
```
Sorumluluk:
• User registration
• Email/password login
• OAuth (Google, Apple)
• JWT token generation (access + refresh)
• Refresh token rotation
• Password reset
• Email verification
• 2FA (TOTP)
• Session management

Bağımlılıklar:
• MongoDB (users collection)
• Redis (sessions, tokens, blacklist)
• Email service (verification, reset)
• Identity Platform (OAuth)
```

#### user-service
```
Sorumluluk:
• Profile CRUD
• User settings (privacy, notifications, display)
• Follow/unfollow
• Block/unblock/mute
• User search
• Public key management (E2EE)
• Profile stats

Bağımlılıklar:
• MongoDB (users, user_settings, user_keys, follows)
• Redis (user cache, following list)
• Pub/Sub (user events publisher)
```

#### post-service
```
Sorumluluk:
• Post CRUD (text, image, video, poll)
• Poll creation & voting
• Hashtag extraction
• Mention extraction
• Post visibility control
• Pin post to profile

Bağımlılıklar:
• MongoDB (posts)
• Redis (post cache)
• Pub/Sub (post events publisher)
• Media Service (media validation)
```

#### feed-service
```
Sorumluluk:
• Home feed (following timeline)
• Explore feed (algorithmic)
• User profile timeline
• Hashtag feed
• Trending calculation
• Feed caching

Bağımlılıklar:
• MongoDB (posts - read only)
• Redis (feed cache, trending data)
• User Service (following list)
• Pub/Sub (subscriber: post, interaction events)
```

#### interaction-service
```
Sorumluluk:
• Like/unlike post
• Dislike post
• Comment CRUD (threaded)
• Repost/quote repost
• Bookmark/unbookmark
• Poll voting

Bağımlılıklar:
• MongoDB (interactions, comments, bookmarks)
• Redis (counts cache)
• Pub/Sub (interaction events publisher)
```

#### media-service
```
Sorumluluk:
• File upload handling (multipart)
• Image resize & compress
• Video transcoding (FFmpeg)
• Thumbnail generation
• CDN URL generation
• Media deletion
• Blurhash generation

Bağımlılıklar:
• Cloud Storage (file storage)
• Cloud CDN (delivery)
• FFmpeg (video processing)
```

#### message-service
```
Sorumluluk:
• WebSocket connection management
• Real-time message delivery
• Typing indicator
• Online status tracking
• Read/delivered receipts
• Conversation management
• Message persistence
• E2EE support (encrypted payload transport)

Bağımlılıklar:
• MongoDB (conversations, messages, messaging_settings)
• Redis (online status, typing state, Socket.IO adapter)
• FCM (offline push fallback)
• Pub/Sub (message events)
```

#### notification-service
```
Sorumluluk:
• Push notifications (FCM)
• Email notifications
• In-app notifications
• Notification preferences check
• Batch/digest notifications
• Notification history

Bağımlılıklar:
• MongoDB (notifications, notification_settings)
• Redis (notification queue)
• FCM (push)
• Email provider (SendGrid/AWS SES)
• Pub/Sub (subscriber: all events)
```

#### admin-service
```
Sorumluluk:
• Admin authentication (separate)
• Dashboard statistics
• User management (view, ban, suspend)
• Content moderation
• Report handling
• Feature flag management
• System configuration
• Admin action logs

Bağımlılıklar:
• MongoDB (all collections read, admin_users, admin_logs, feature_flags, reports write)
• Redis (stats cache, flags cache)
```

#### listing-service (Faz 2)
```
Sorumluluk:
• Listing CRUD
• Category tree management
• Listing search & filters
• Favorites management
• Listing promotion (paid)
• Seller features
• Price alerts

Bağımlılıklar:
• MongoDB (listings, listing_categories, listing_favorites, listing_settings)
• Redis (listing cache, search cache)
• Media Service (listing photos/videos)
• Message Service (seller-buyer chat)
• Pub/Sub (listing events)
```

#### dating-service (Faz 3)
```
Sorumluluk:
• Dating profile management
• Discover algorithm (location, preferences)
• Swipe handling (like/pass/superlike)
• Match detection & creation
• Match management (unmatch)
• Boost & premium features

Bağımlılıklar:
• MongoDB (dating_profiles, swipes, matches)
• Redis (discover queue, boost status)
• Message Service (match conversation auto-create)
• Notification Service (match alerts)
• Pub/Sub (dating events)
```

---

## Servisler Arası İletişim

### 1. Synchronous (HTTP)

Response hemen gerektiğinde kullanılır.

```
┌─────────────┐    HTTP GET     ┌─────────────┐
│ API Gateway │ ──────────────► │ Auth Service│
│             │                 │             │
│ POST /posts │   200 OK        │ validateJWT │
│             │ ◄────────────── │             │
└─────────────┘   {userId}      └─────────────┘
```

**Senaryolar:**
- Token validation (her request)
- User profile lookup (post author bilgisi)
- Permission check
- Real-time data fetch

**Kurallar:**
- Timeout: 5 saniye
- Retry: 2 kez (exponential backoff)
- Circuit breaker: 5 fail = open

---

### 2. Asynchronous (Pub/Sub)

Fire-and-forget, loose coupling.

```
┌─────────────┐    publish     ┌─────────────┐    subscribe   ┌─────────────┐
│ Post Service│ ─────────────► │   Pub/Sub   │ ─────────────► │Feed Service │
│             │                │             │                │             │
│ post.created│                │ post-events │                │ update feed │
└─────────────┘                │   topic     │                └─────────────┘
                               │             │
                               │             │    subscribe   ┌─────────────┐
                               │             │ ─────────────► │ Notification│
                               │             │                │   Service   │
                               └─────────────┘                │notify mention│
                                                              └─────────────┘
```

**Senaryolar:**
- Post created → Update feeds, notify mentions
- User followed → Notify user
- Message sent (offline) → Send push
- Interaction → Update counts, notify

**Kurallar:**
- At-least-once delivery
- Idempotent consumers
- Dead letter queue for failures

---

### 3. WebSocket (Real-time)

Bidirectional, persistent connection.

```
┌─────────────┐                 ┌─────────────┐                 ┌─────────────┐
│  Client A   │ ◄─────────────► │   Message   │ ◄─────────────► │  Client B   │
│  (Flutter)  │    WebSocket    │   Service   │    WebSocket    │  (Flutter)  │
│             │                 │             │                 │             │
│ typing:start│ ───────────────►│             │────────────────►│typing:update│
│ message:send│ ───────────────►│   Redis     │────────────────►│ message:new │
│             │                 │  Pub/Sub    │                 │             │
└─────────────┘                 └─────────────┘                 └─────────────┘
```

**Senaryolar:**
- Chat messages
- Typing indicator
- Online status
- Read receipts

---

## Pub/Sub Topics

| Topic | Publisher | Subscribers | Events |
|-------|-----------|-------------|--------|
| user-events | User Service | Feed, Notification | user.created, user.updated, user.followed, user.blocked |
| post-events | Post Service | Feed, Notification, Trend | post.created, post.updated, post.deleted |
| interaction-events | Interaction Service | Notification, Trend, Feed | post.liked, post.commented, post.reposted |
| message-events | Message Service | Notification | message.sent (offline user) |
| media-events | Media Service | Post, User | media.processed, media.failed |
| listing-events | Listing Service | Notification, Search | listing.created, listing.updated |
| dating-events | Dating Service | Notification, Message | match.created, swipe.superlike |

---

## Data Flow Örnekleri

### 1. Post Oluşturma

```
1. Client ──────────────────► API Gateway
   POST /posts {text, mediaIds}
   
2. API Gateway ─────────────► Auth Service
   Validate JWT token
   
3. API Gateway ─────────────► Post Service
   Create post
   
4. Post Service ────────────► MongoDB
   Save post document
   
5. Post Service ────────────► Pub/Sub
   Publish: post-events/post.created
   
6. Feed Service ◄─────────── Pub/Sub
   Update followers' feeds (async)
   
7. Notification Service ◄─── Pub/Sub
   Notify mentioned users (async)
   
8. Post Service ────────────► API Gateway
   Return created post
   
9. API Gateway ─────────────► Client
   201 Created {post}
```

### 2. Mesaj Gönderme

```
1. Client A ────────────────► Message Service
   WebSocket: message:send {encrypted}
   
2. Message Service ─────────► MongoDB
   Save encrypted message
   
3. Message Service ─────────► Redis
   Check if User B online
   
4a. User B ONLINE:
    Message Service ────────► Client B
    WebSocket: message:new {encrypted}
    
4b. User B OFFLINE:
    Message Service ────────► Pub/Sub
    Publish: message-events/message.sent
    
    Notification Service ◄── Pub/Sub
    Send FCM push notification
    
5. Message Service ─────────► Client A
   WebSocket: message:sent {messageId, sentAt}
```

### 3. Feed Yükleme

```
1. Client ──────────────────► API Gateway
   GET /feed/home?cursor=xxx
   
2. API Gateway ─────────────► Feed Service
   Get home feed
   
3. Feed Service ────────────► Redis
   Check feed cache
   
4a. CACHE HIT:
    Return cached feed
    
4b. CACHE MISS:
    Feed Service ───────────► MongoDB
    Query posts from following users
    
    Feed Service ───────────► User Service
    Enrich with author profiles
    
    Feed Service ───────────► Redis
    Cache result (TTL: 1 min)
    
5. Feed Service ────────────► API Gateway
   Return posts with authors
   
6. API Gateway ─────────────► Client
   200 OK {posts, pagination}
```

---

## Caching Strategy

### Redis Key Patterns

| Pattern | Data | TTL | Invalidation |
|---------|------|-----|--------------|
| `user:{id}` | User profile | 5 min | On update |
| `user:{id}:settings` | User settings | 5 min | On update |
| `post:{id}` | Post data | 5 min | On update/delete |
| `feed:home:{userId}:{cursor}` | Feed page | 1 min | On new post |
| `feed:explore:{cursor}` | Explore feed | 1 min | Scheduled |
| `following:{userId}` | Following IDs | 5 min | On follow/unfollow |
| `followers:{userId}` | Follower IDs | 5 min | On follow/unfollow |
| `trending:hashtags` | Trending tags | 5 min | Scheduled job |
| `flags:all` | All feature flags | 60 sec | On flag update |
| `flags:{key}` | Single flag | 60 sec | On flag update |
| `online:{userId}` | Online status | 60 sec | Heartbeat refresh |
| `typing:{convId}:{userId}` | Typing state | 3 sec | Auto expire |
| `session:{userId}:{deviceId}` | Session data | 7 days | On logout |
| `rate:{ip}:{endpoint}` | Rate limit counter | 1 min | Auto expire |
| `pubkey:{userId}` | E2EE public key | 1 hour | On key update |

### Cache Invalidation

```
1. Write-through: Update DB + Cache together
2. Event-based: Pub/Sub event triggers cache delete
3. TTL-based: Auto expire for eventual consistency
```

---

## Security

### Authentication Flow

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   Client   │     │   Gateway  │     │   Auth     │
│            │     │            │     │  Service   │
└─────┬──────┘     └─────┬──────┘     └─────┬──────┘
      │                  │                  │
      │ POST /auth/login │                  │
      │─────────────────►│                  │
      │                  │   validate       │
      │                  │─────────────────►│
      │                  │                  │
      │                  │   tokens         │
      │                  │◄─────────────────│
      │  accessToken     │                  │
      │  refreshToken    │                  │
      │◄─────────────────│                  │
      │                  │                  │
      │ GET /posts       │                  │
      │ Auth: Bearer xxx │                  │
      │─────────────────►│                  │
      │                  │  verify JWT      │
      │                  │─────────────────►│
      │                  │  {userId}        │
      │                  │◄─────────────────│
      │                  │                  │
      │                  │  forward to      │
      │                  │  Post Service    │
      │  response        │                  │
      │◄─────────────────│                  │
```

### Token Strategy

| Token | Lifetime | Storage (Client) | Usage |
|-------|----------|------------------|-------|
| Access Token | 15 min | Memory | API requests |
| Refresh Token | 7 days | Secure Storage | Get new access token |

### Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| IP (unauthenticated) | 60 req | 1 min |
| IP (authenticated) | 120 req | 1 min |
| User | 300 req | 1 min |
| POST /auth/login | 5 req | 1 min |
| POST /posts | 30 req | 1 min |
| WebSocket events | 60 msg | 1 min |

### Security Measures

```
1. HTTPS everywhere (TLS 1.3)
2. JWT with RS256 (asymmetric)
3. Refresh token rotation
4. Rate limiting (IP + User)
5. Input validation (Zod schemas)
6. SQL injection N/A (MongoDB)
7. XSS prevention (sanitization)
8. CORS whitelist
9. Helmet headers
10. E2EE for messages (X25519 + AES-GCM)
11. Password hashing (bcrypt, cost 12)
12. 2FA support (TOTP)
```

---

## Monitoring & Observability

### Metrics (Cloud Monitoring)

```
- Request latency (p50, p95, p99)
- Request count by endpoint
- Error rate by service
- Active WebSocket connections
- Message throughput
- Cache hit/miss ratio
- Database query time
- CPU/Memory per service
```

### Logging (Cloud Logging)

```
Structured JSON logs:
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "post-service",
  "traceId": "abc123",
  "userId": "user_456",
  "action": "post.create",
  "duration": 45,
  "status": "success"
}
```

### Alerts

| Condition | Severity | Action |
|-----------|----------|--------|
| Error rate > 1% | Warning | Slack notification |
| Error rate > 5% | Critical | PagerDuty |
| Latency p95 > 500ms | Warning | Slack notification |
| Latency p95 > 2s | Critical | PagerDuty |
| Service down | Critical | Auto-restart + PagerDuty |
| Memory > 80% | Warning | Slack notification |

---

## Deployment

### CI/CD Pipeline (GitHub Actions + Cloud Build)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │     │   Cloud     │     │  Artifact   │     │  Cloud Run  │
│    Push     │────►│   Build     │────►│  Registry   │────►│   Deploy    │
│             │     │             │     │             │     │             │
│ main branch │     │ • Lint      │     │ Docker      │     │ • Staging   │
│             │     │ • Test      │     │ images      │     │ • Canary    │
│             │     │ • Build     │     │             │     │ • Prod      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Deployment Strategy

```
1. Push to main
2. Run tests (unit + integration)
3. Build Docker images (affected services only)
4. Deploy to Staging
5. Run smoke tests
6. Manual approval (optional)
7. Canary deploy (10% traffic)
8. Monitor 10 minutes
9. Gradual rollout (10% → 50% → 100%)
10. Auto rollback on error spike
```

### Infrastructure as Code (Terraform)

```
infrastructure/
├── modules/
│   ├── cloud-run/
│   ├── redis/
│   ├── pubsub/
│   ├── storage/
│   └── networking/
├── environments/
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
└── main.tf
```

---

## Scaling

### Auto-scaling Rules (Cloud Run)

| Service | Min | Max | Scale Trigger |
|---------|-----|-----|---------------|
| api-gateway | 1 | 20 | CPU > 70% |
| auth-service | 1 | 10 | CPU > 70% |
| user-service | 1 | 10 | CPU > 70% |
| post-service | 1 | 15 | CPU > 70% |
| feed-service | 2 | 20 | CPU > 70% |
| message-service | 2 | 30 | Connections > 500 |
| notification-service | 1 | 10 | Queue size |

### Database Scaling

```
MongoDB Atlas:
- MVP: M10 (shared)
- Growth: M30 (dedicated)
- Scale: M50+ with sharding

Redis:
- MVP: 1GB Basic
- Growth: 5GB Standard (HA)
- Scale: 10GB+ Cluster
```

---

## Disaster Recovery

### Backup Strategy

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| MongoDB | Continuous | 7 days point-in-time | Atlas |
| Redis | Daily snapshot | 3 days | GCS |
| Media files | N/A (durable) | Lifecycle policy | GCS |
| Logs | Real-time | 30 days | Cloud Logging |

### Recovery Objectives

```
RPO (Recovery Point Objective): < 1 hour
RTO (Recovery Time Objective): < 4 hours
```

### Multi-region (Future)

```
Primary: europe-west1 (Belgium)
Secondary: us-central1 (Iowa) - read replicas
```
