# Build aşaması
FROM node:20-alpine AS builder

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Root package dosyaları
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Shared paketler
COPY packages/ ./packages/

# User service
COPY apps/user-service/ ./apps/user-service/

# Bağımlılıkları yükle
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm --filter @superapp/user-service build

# Production aşaması
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Non-root kullanıcı
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Production bağımlılıkları
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/user-service/package.json ./apps/user-service/
COPY --from=builder /app/apps/user-service/dist ./apps/user-service/dist

RUN pnpm install --frozen-lockfile --prod

# Ownership değiştir
RUN chown -R nestjs:nodejs /app

USER nestjs

WORKDIR /app/apps/user-service

# Port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Başlat
CMD ["node", "dist/main.js"]
