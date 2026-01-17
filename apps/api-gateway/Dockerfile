# ==================== BUILD STAGE ====================
FROM node:20-alpine AS builder

# pnpm kurulumu
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Shared packages
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-database/package.json ./packages/shared-database/
COPY packages/shared-auth/package.json ./packages/shared-auth/
COPY packages/shared-logger/package.json ./packages/shared-logger/

# Service package
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/ ./packages/
COPY apps/api-gateway/ ./apps/api-gateway/

# Build shared packages
RUN pnpm --filter @superapp/shared-types build
RUN pnpm --filter @superapp/shared-utils build
RUN pnpm --filter @superapp/shared-database build
RUN pnpm --filter @superapp/shared-auth build
RUN pnpm --filter @superapp/shared-logger build

# Build service
RUN pnpm --filter @superapp/api-gateway build

# ==================== PRODUCTION STAGE ====================
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Güvenlik için non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Production dependencies only
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/shared-utils/package.json ./packages/shared-utils/
COPY --from=builder /app/packages/shared-database/package.json ./packages/shared-database/
COPY --from=builder /app/packages/shared-auth/package.json ./packages/shared-auth/
COPY --from=builder /app/packages/shared-logger/package.json ./packages/shared-logger/
COPY --from=builder /app/apps/api-gateway/package.json ./apps/api-gateway/

RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder /app/packages/shared-database/dist ./packages/shared-database/dist
COPY --from=builder /app/packages/shared-auth/dist ./packages/shared-auth/dist
COPY --from=builder /app/packages/shared-logger/dist ./packages/shared-logger/dist
COPY --from=builder /app/apps/api-gateway/dist ./apps/api-gateway/dist

# Ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start
CMD ["node", "apps/api-gateway/dist/main.js"]
