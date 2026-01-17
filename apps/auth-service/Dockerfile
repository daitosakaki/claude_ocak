# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# pnpm kurulumu
RUN npm install -g pnpm

# Dependency dosyalarını kopyala
COPY package.json pnpm-lock.yaml* ./

# Bağımlılıkları yükle
RUN pnpm install --frozen-lockfile

# Kaynak kodları kopyala
COPY . .

# Build
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# pnpm kurulumu
RUN npm install -g pnpm

# Sadece production bağımlılıkları
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# Build çıktısını kopyala
COPY --from=builder /app/dist ./dist

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Başlat
CMD ["node", "dist/main"]
