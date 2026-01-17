# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependency dosyalarını kopyala
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/listing-service/package.json ./apps/listing-service/
COPY packages/ ./packages/

# Bağımlılıkları yükle
RUN pnpm install --frozen-lockfile

# Kaynak kodları kopyala
COPY apps/listing-service/ ./apps/listing-service/
COPY tsconfig.base.json ./

# Build
WORKDIR /app/apps/listing-service
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

# Sadece production bağımlılıklarını kopyala
COPY --from=builder /app/apps/listing-service/dist ./dist
COPY --from=builder /app/apps/listing-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Port
EXPOSE 3009

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3009/health || exit 1

# Başlat
CMD ["node", "dist/main.js"]
