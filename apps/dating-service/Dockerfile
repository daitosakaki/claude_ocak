# Build aşaması
FROM node:20-alpine AS builder

WORKDIR /app

# pnpm kurulumu
RUN npm install -g pnpm

# Monorepo dosyalarını kopyala
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/dating-service ./apps/dating-service

# Bağımlılıkları yükle
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm --filter @superapp/dating-service build

# Production aşaması
FROM node:20-alpine AS production

WORKDIR /app

# pnpm kurulumu
RUN npm install -g pnpm

# Non-root kullanıcı oluştur
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Gerekli dosyaları kopyala
COPY --from=builder /app/apps/dating-service/dist ./dist
COPY --from=builder /app/apps/dating-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Kullanıcıyı değiştir
USER nestjs

# Port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3010/health || exit 1

# Uygulamayı başlat
CMD ["node", "dist/main.js"]
