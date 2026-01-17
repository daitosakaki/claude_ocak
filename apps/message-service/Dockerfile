# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

# Bağımlılık dosyalarını kopyala
COPY package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/message-service/package.json ./apps/message-service/

# Bağımlılıkları yükle
RUN pnpm install --frozen-lockfile

# Kaynak kodları kopyala
COPY apps/message-service ./apps/message-service

# Build
RUN pnpm --filter @superapp/message-service build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Güvenlik: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

# Sadece production bağımlılıklarını kopyala
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/message-service/dist ./dist
COPY --from=builder /app/apps/message-service/package.json ./

# Kullanıcı değiştir
USER nestjs

# Port
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3007/health || exit 1

# Başlat
CMD ["node", "dist/main.js"]
