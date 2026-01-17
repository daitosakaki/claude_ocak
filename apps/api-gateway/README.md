# API Gateway

SuperApp API Gateway servisi. Tüm client request'lerini karşılayan ve uygun microservice'lere yönlendiren merkezi giriş noktası.

## Sorumluluklar

- **JWT Token Validation**: Her korumalı endpoint için token doğrulama
- **Request Routing**: URL pattern'ine göre downstream servislere yönlendirme
- **Rate Limiting**: IP ve kullanıcı bazlı rate limiting
- **Request/Response Logging**: Structured JSON logging
- **CORS Handling**: Cross-origin request yönetimi
- **Error Handling**: Standart error response formatı

## Port

`3000`

## Başlatma

```bash
# Development
pnpm dev

# Production
pnpm start:prod
```

## Environment Variables

`.env.example` dosyasını `.env` olarak kopyalayın ve değerleri güncelleyin.

## Endpoints

### Health Check

```
GET /health         - Genel sağlık durumu
GET /health/live    - Liveness probe
GET /health/ready   - Readiness probe
GET /health/details - Detaylı rapor
```

### Proxy Routes

Tüm `/v1/*` route'ları otomatik olarak downstream servislere yönlendirilir.

## Mimari

```
Request
   │
   ▼
┌─────────────────────────────────────┐
│         RequestIdMiddleware         │ ← Unique request ID
├─────────────────────────────────────┤
│          LoggingMiddleware          │ ← Request/response log
├─────────────────────────────────────┤
│         RateLimitMiddleware         │ ← Rate limiting
├─────────────────────────────────────┤
│           AuthMiddleware            │ ← JWT validation
├─────────────────────────────────────┤
│          ProxyController            │ ← Route matching
├─────────────────────────────────────┤
│           ProxyService              │ ← Forward to service
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Circuit Breaker           │   │
│  │   Retry Logic               │   │
│  │   Timeout Handling          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
   │
   ▼
Downstream Service
```

## Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| IP (unauthenticated) | 60 req | 1 min |
| IP (authenticated) | 120 req | 1 min |
| User | 300 req | 1 min |
| POST /auth/login | 5 req | 1 min |
| POST /posts | 30 req | 1 min |

## Circuit Breaker

- **Failure Threshold**: 5 ardışık hata
- **Reset Timeout**: 30 saniye
- **States**: CLOSED → OPEN → HALF_OPEN → CLOSED

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

## Response Headers

```
X-Request-Id: <uuid>
X-Response-Time: 45ms
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 95
X-Rate-Limit-Reset: 1642000000
```

## Docker

```bash
# Build
docker build -t superapp/api-gateway .

# Run
docker run -p 3000:3000 --env-file .env superapp/api-gateway
```

## Test

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```
