# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

# Root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Shared packages
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-database/package.json ./packages/shared-database/
COPY packages/shared-auth/package.json ./packages/shared-auth/
COPY packages/shared-pubsub/package.json ./packages/shared-pubsub/
COPY packages/shared-logger/package.json ./packages/shared-logger/

# Feed service package
COPY apps/feed-service/package.json ./apps/feed-service/

# Bağımlılıkları yükle
RUN pnpm install --frozen-lockfile

# Shared packages source
COPY packages/ ./packages/

# Feed service source
COPY apps/feed-service/ ./apps/feed-service/

# Build shared packages
RUN pnpm --filter @superapp/shared-types build
RUN pnpm --filter @superapp/shared-utils build
RUN pnpm --filter @superapp/shared-database build
RUN pnpm --filter @superapp/shared-auth build
RUN pnpm --filter @superapp/shared-pubsub build
RUN pnpm --filter @superapp/shared-logger build

# Build feed service
RUN pnpm --filter @superapp/feed-service build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Sadece production bağımlılıkları
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/shared-utils/package.json ./packages/shared-utils/
COPY --from=builder /app/packages/shared-database/package.json ./packages/shared-database/
COPY --from=builder /app/packages/shared-auth/package.json ./packages/shared-auth/
COPY --from=builder /app/packages/shared-pubsub/package.json ./packages/shared-pubsub/
COPY --from=builder /app/packages/shared-logger/package.json ./packages/shared-logger/
COPY --from=builder /app/apps/feed-service/package.json ./apps/feed-service/

RUN pnpm install --frozen-lockfile --prod

# Build artifacts
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder /app/packages/shared-database/dist ./packages/shared-database/dist
COPY --from=builder /app/packages/shared-auth/dist ./packages/shared-auth/dist
COPY --from=builder /app/packages/shared-pubsub/dist ./packages/shared-pubsub/dist
COPY --from=builder /app/packages/shared-logger/dist ./packages/shared-logger/dist
COPY --from=builder /app/apps/feed-service/dist ./apps/feed-service/dist

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

# Environment
ENV NODE_ENV=production
ENV PORT=3004

EXPOSE 3004

WORKDIR /app/apps/feed-service

CMD ["node", "dist/main"]
