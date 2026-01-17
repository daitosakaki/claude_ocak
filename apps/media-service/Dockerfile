# ==========================================
# SuperApp Media Service Dockerfile
# ==========================================

# Build stage
FROM node:20-alpine AS builder

# FFmpeg kurulumu (video processing için)
RUN apk add --no-cache ffmpeg

WORKDIR /app

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

# Bağımlılık dosyalarını kopyala
COPY package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/media-service/package.json ./apps/media-service/

# Bağımlılıkları yükle
RUN pnpm install --frozen-lockfile

# Kaynak kodları kopyala
COPY apps/media-service ./apps/media-service
COPY tsconfig.base.json ./

# Build
RUN pnpm --filter @superapp/media-service build

# Production stage
FROM node:20-alpine AS production

# FFmpeg kurulumu (video processing için)
RUN apk add --no-cache ffmpeg

WORKDIR /app

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

# Sadece production bağımlılıklarını kopyala
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/media-service/dist ./dist
COPY --from=builder /app/apps/media-service/package.json ./

# Non-root user oluştur
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Temp dizini oluştur (upload için)
RUN mkdir -p /tmp/uploads && chown nestjs:nodejs /tmp/uploads

USER nestjs

# Port
EXPOSE 3006

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3006/health || exit 1

# Başlat
CMD ["node", "dist/main.js"]
