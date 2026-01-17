# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependency dosyalarını kopyala
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/notification-service/package.json ./apps/notification-service/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-database/package.json ./packages/shared-database/
COPY packages/shared-auth/package.json ./packages/shared-auth/
COPY packages/shared-pubsub/package.json ./packages/shared-pubsub/
COPY packages/shared-logger/package.json ./packages/shared-logger/

# Bağımlılıkları yükle
RUN pnpm install --frozen-lockfile

# Kaynak kodları kopyala
COPY packages ./packages
COPY apps/notification-service ./apps/notification-service

# Shared paketleri build et
RUN pnpm --filter @superapp/shared-types build
RUN pnpm --filter @superapp/shared-utils build
RUN pnpm --filter @superapp/shared-database build
RUN pnpm --filter @superapp/shared-auth build
RUN pnpm --filter @superapp/shared-pubsub build
RUN pnpm --filter @superapp/shared-logger build

# Servisi build et
RUN pnpm --filter @superapp/notification-service build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

# Sadece production bağımlılıkları
ENV NODE_ENV=production

# Build edilmiş dosyaları kopyala
COPY --from=builder /app/apps/notification-service/dist ./dist
COPY --from=builder /app/apps/notification-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Non-root kullanıcı
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3008/health || exit 1

# Port
EXPOSE 3008

# Başlat
CMD ["node", "dist/main.js"]
