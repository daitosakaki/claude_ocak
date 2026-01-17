# Auth Service

SuperApp Kimlik Doğrulama Servisi

## Özellikler

- ✅ Email/Şifre ile kayıt ve giriş
- ✅ JWT token yönetimi (Access + Refresh)
- ✅ OAuth entegrasyonları (Google, Apple)
- ✅ Token rotation (güvenli yenileme)
- ✅ Multi-device oturum yönetimi
- ✅ Şifre sıfırlama
- ✅ Email doğrulama
- ✅ Rate limiting
- ✅ 2FA desteği (TOTP) - gelecek

## Teknolojiler

- **Framework**: NestJS 10
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis
- **Auth**: Passport.js + JWT
- **Validation**: class-validator

## Kurulum

```bash
# Bağımlılıkları yükle
pnpm install

# .env dosyasını oluştur
cp .env.example .env

# Development modunda çalıştır
pnpm start:dev

# Production build
pnpm build
pnpm start:prod
```

## API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /auth/register | Yeni kullanıcı kaydı |
| POST | /auth/login | Kullanıcı girişi |
| POST | /auth/logout | Çıkış (token iptal) |
| POST | /auth/logout-all | Tüm cihazlardan çıkış |
| POST | /auth/refresh | Token yenileme |
| POST | /auth/forgot-password | Şifre sıfırlama isteği |
| POST | /auth/reset-password | Şifre sıfırlama |
| POST | /auth/verify-email | Email doğrulama |
| POST | /auth/resend-verification | Doğrulama emaili tekrar gönder |
| POST | /auth/oauth/google | Google ile giriş |
| POST | /auth/oauth/apple | Apple ile giriş |
| GET | /auth/me | Mevcut kullanıcı bilgileri |
| GET | /auth/health | Health check |

## Token Stratejisi

### Access Token
- Süre: 15 dakika
- Kullanım: API istekleri
- Header: `Authorization: Bearer <token>`

### Refresh Token
- Süre: 7 gün
- Kullanım: Yeni access token almak için
- Depolama: Secure Storage (client)

### Token Rotation
Her token yenileme işleminde:
1. Eski refresh token blacklist'e eklenir
2. Yeni access + refresh token döner
3. Bu sayede çalınan token'lar hızla geçersiz olur

## Güvenlik

- Şifreler bcrypt ile hash'lenir (cost: 12)
- JWT RS256 algoritması önerilir
- Rate limiting aktif
- CORS whitelist
- Helmet headers
- Input validation

## Klasör Yapısı

```
src/
├── main.ts                 # Entry point
├── app.module.ts           # Ana modül
├── auth.module.ts          # Auth modülü
├── auth.controller.ts      # HTTP endpoints
├── auth.service.ts         # İş mantığı
├── config/                 # Konfigürasyon
├── dto/                    # Data Transfer Objects
├── schemas/                # MongoDB şemaları
├── guards/                 # Auth guards
├── strategies/             # Passport stratejileri
├── services/               # Alt servisler
└── filters/                # Exception filters
```

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/superapp

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# OAuth
GOOGLE_CLIENT_ID=your-client-id
APPLE_CLIENT_ID=your-client-id
```

## Test

```bash
# Unit testler
pnpm test

# E2E testler
pnpm test:e2e

# Coverage
pnpm test:cov
```

## Docker

```bash
# Build
docker build -t auth-service .

# Run
docker run -p 3001:3001 --env-file .env auth-service
```

## İlgili Servisler

- **api-gateway**: Token validation, routing
- **user-service**: Kullanıcı profil yönetimi
- **notification-service**: Email gönderimi
