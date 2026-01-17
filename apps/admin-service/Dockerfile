# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependency dosyalarını kopyala
COPY package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/admin-service/package.json ./apps/admin-service/

# Bağımlılıkları yükle
RUN pnpm install --frozen-lockfile

# Kaynak kodları kopyala
COPY apps/admin-service ./apps/admin-service

# Build
RUN pnpm --filter @superapp/admin-service build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

# Production bağımlılıkları
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/admin-service/package.json ./apps/admin-service/

RUN pnpm install --frozen-lockfile --prod

# Build çıktısını kopyala
COPY --from=builder /app/apps/admin-service/dist ./apps/admin-service/dist

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

USER nestjs

# Port
EXPOSE 3011

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3011/health || exit 1

# Başlat
CMD ["node", "apps/admin-service/dist/main.js"]
