# Feed Service

SuperApp Feed Service - Timeline, Explore ve Trending API

## Genel Bakış

Feed Service, kullanıcıların timeline (home feed), keşfet (explore) ve gündem (trending) içeriklerini yönetir.

### Özellikler

- **Home Feed**: Takip edilen kullanıcıların gönderileri
- **Explore Feed**: Algoritmik/popüler gönderiler
- **User Timeline**: Belirli kullanıcının gönderileri
- **Hashtag Feed**: Belirli hashtag'e sahip gönderiler
- **Trending**: Gündem olan hashtag ve konular

### Port: 3004

## API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/v1/feed/home` | Home feed |
| GET | `/api/v1/feed/explore` | Explore feed |
| GET | `/api/v1/feed/user/:userId` | User timeline |
| GET | `/api/v1/feed/hashtag/:tag` | Hashtag feed |
| GET | `/api/v1/trending` | Trending konular |
| GET | `/api/v1/health` | Health check |

## Query Parametreleri

### Feed Endpoints

| Parametre | Tip | Varsayılan | Açıklama |
|-----------|-----|------------|----------|
| cursor | string | - | Sayfalama cursor |
| limit | number | 20 | Sayfa başına öğe (max: 50) |
| sortBy | string | recent | Sıralama (recent, popular, relevant) |
| mediaOnly | boolean | false | Sadece medyalı gönderiler |
| pollsOnly | boolean | false | Sadece anketli gönderiler |
| includeReposts | boolean | true | Repost'ları dahil et |
| includeReplies | boolean | false | Yanıtları dahil et |

### Trending Endpoint

| Parametre | Tip | Varsayılan | Açıklama |
|-----------|-----|------------|----------|
| region | string | TR | Bölge kodu (ISO 3166-1 alpha-2) |
| period | string | daily | Periyot (hourly, daily, weekly) |
| limit | number | 20 | Sonuç sayısı (max: 50) |

## Mimari

```
┌─────────────────┐     ┌─────────────────┐
│   API Gateway   │────▶│   Feed Service  │
└─────────────────┘     └────────┬────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    MongoDB      │     │     Redis       │     │    Pub/Sub      │
│                 │     │                 │     │                 │
│ • posts         │     │ • feed cache    │     │ • post-events   │
│ • follows       │     │ • following     │     │ • interaction   │
│ • hashtags      │     │ • trending      │     │   events        │
│ • trends        │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Cache Stratejisi

| Cache Key | TTL | Açıklama |
|-----------|-----|----------|
| `feed:home:{userId}:{cursor}` | 1 dk | Home feed |
| `feed:explore:{cursor}` | 5 dk | Explore feed |
| `feed:user:{userId}:{cursor}` | 2 dk | User timeline |
| `feed:hashtag:{tag}:{cursor}` | 2 dk | Hashtag feed |
| `feed:trending:{region}:{period}` | 5 dk | Trending |
| `feed:following:{userId}` | 5 dk | Following listesi |

## Event'ler (Pub/Sub)

### Dinlenen Event'ler

| Topic | Event | Aksiyon |
|-------|-------|---------|
| post-events | post.created | Timeline cache invalidation |
| post-events | post.updated | Timeline cache invalidation |
| post-events | post.deleted | Timeline cache invalidation |
| interaction-events | post.liked | Explore cache invalidation |
| interaction-events | post.commented | Explore cache invalidation |
| interaction-events | post.reposted | Timeline cache invalidation |

## Kurulum

### Gereksinimler

- Node.js 20+
- MongoDB
- Redis
- pnpm

### Geliştirme

```bash
# Bağımlılıkları yükle
pnpm install

# Geliştirme modunda çalıştır
pnpm dev

# Build
pnpm build

# Test
pnpm test
```

### Environment Variables

`.env.example` dosyasını `.env` olarak kopyalayın ve değerleri düzenleyin.

```bash
cp .env.example .env
```

### Docker

```bash
# Build
docker build -t feed-service .

# Run
docker run -p 3004:3004 --env-file .env feed-service
```

## Performans Optimizasyonları

1. **Cursor-based Pagination**: Offset yerine cursor kullanarak hızlı sayfalama
2. **Redis Cache**: Sık erişilen veriler için önbellek
3. **Aggregation Pipeline**: MongoDB aggregation ile verimli sorgular
4. **Event-driven Cache Invalidation**: Pub/Sub ile akıllı cache temizleme
5. **Connection Pooling**: MongoDB ve Redis için connection pool

## Monitoring

- Health endpoint: `/api/v1/health`
- Swagger UI: `/docs` (sadece development)
- Structured logging (JSON format)

## Klasör Yapısı

```
src/
├── main.ts                 # Entry point
├── app.module.ts           # Root module
├── feed.module.ts          # Feed module
├── feed.controller.ts      # API endpoints
├── feed.service.ts         # Main service
├── config/
│   └── index.ts            # Configuration
├── dto/
│   ├── feed-query.dto.ts   # Query DTOs
│   ├── trending-query.dto.ts
│   └── feed-response.dto.ts
├── schemas/
│   ├── post.schema.ts      # MongoDB schemas
│   ├── follow.schema.ts
│   ├── hashtag.schema.ts
│   └── trend.schema.ts
├── services/
│   ├── home-feed.service.ts
│   ├── explore-feed.service.ts
│   ├── trending.service.ts
│   └── feed-cache.service.ts
└── subscribers/
    ├── post.subscriber.ts
    └── interaction.subscriber.ts
```
