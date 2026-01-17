# SuperApp Backend - Dosya Yapısı

## Monorepo Yapısı (pnpm workspaces + Turborepo)

```
superapp-backend/
│
├── 📄 package.json                    # Root package.json (workspaces)
├── 📄 pnpm-workspace.yaml             # pnpm workspace config
├── 📄 turbo.json                      # Turborepo config
├── 📄 tsconfig.base.json              # Shared TypeScript config
├── 📄 .eslintrc.js                    # ESLint config
├── 📄 .prettierrc                     # Prettier config
├── 📄 .gitignore
├── 📄 .env.example
├── 📄 docker-compose.yml              # Local development
├── 📄 docker-compose.prod.yml         # Production
├── 📄 Makefile                        # Common commands
├── 📄 README.md
│
├── 📁 apps/                           # Microservices
│   │
│   ├── 📁 api-gateway/                # Port: 3000
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 nest-cli.json
│   │   └── 📁 src/
│   │       ├── 📄 main.ts
│   │       ├── 📄 app.module.ts
│   │       ├── 📁 config/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 app.config.ts
│   │       │   └── 📄 services.config.ts
│   │       ├── 📁 middleware/
│   │       │   ├── 📄 auth.middleware.ts
│   │       │   ├── 📄 rate-limit.middleware.ts
│   │       │   ├── 📄 logging.middleware.ts
│   │       │   └── 📄 request-id.middleware.ts
│   │       ├── 📁 proxy/
│   │       │   ├── 📄 proxy.module.ts
│   │       │   ├── 📄 proxy.service.ts
│   │       │   └── 📄 routes.ts
│   │       ├── 📁 health/
│   │       │   ├── 📄 health.module.ts
│   │       │   └── 📄 health.controller.ts
│   │       └── 📁 filters/
│   │           └── 📄 http-exception.filter.ts
│   │
│   ├── 📁 auth-service/               # Port: 3001
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 nest-cli.json
│   │   └── 📁 src/
│   │       ├── 📄 main.ts
│   │       ├── 📄 app.module.ts
│   │       ├── 📄 auth.module.ts
│   │       ├── 📄 auth.controller.ts
│   │       ├── 📄 auth.service.ts
│   │       ├── 📁 config/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 jwt.config.ts
│   │       │   └── 📄 database.config.ts
│   │       ├── 📁 dto/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 login.dto.ts
│   │       │   ├── 📄 register.dto.ts
│   │       │   ├── 📄 refresh-token.dto.ts
│   │       │   ├── 📄 forgot-password.dto.ts
│   │       │   ├── 📄 reset-password.dto.ts
│   │       │   ├── 📄 verify-email.dto.ts
│   │       │   ├── 📄 oauth.dto.ts
│   │       │   └── 📄 auth-response.dto.ts
│   │       ├── 📁 schemas/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 user.schema.ts
│   │       │   └── 📄 session.schema.ts
│   │       ├── 📁 guards/
│   │       │   ├── 📄 jwt-auth.guard.ts
│   │       │   └── 📄 throttle.guard.ts
│   │       ├── 📁 strategies/
│   │       │   ├── 📄 jwt.strategy.ts
│   │       │   ├── 📄 jwt-refresh.strategy.ts
│   │       │   ├── 📄 google.strategy.ts
│   │       │   └── 📄 apple.strategy.ts
│   │       ├── 📁 services/
│   │       │   ├── 📄 token.service.ts
│   │       │   ├── 📄 session.service.ts
│   │       │   ├── 📄 password.service.ts
│   │       │   └── 📄 oauth.service.ts
│   │       └── 📁 filters/
│   │           └── 📄 http-exception.filter.ts
│   │
│   ├── 📁 user-service/               # Port: 3002
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 nest-cli.json
│   │   └── 📁 src/
│   │       ├── 📄 main.ts
│   │       ├── 📄 app.module.ts
│   │       ├── 📄 user.module.ts
│   │       ├── 📄 user.controller.ts
│   │       ├── 📄 user.service.ts
│   │       ├── 📁 config/
│   │       │   └── 📄 index.ts
│   │       ├── 📁 dto/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 update-profile.dto.ts
│   │       │   ├── 📄 update-settings.dto.ts
│   │       │   ├── 📄 user-response.dto.ts
│   │       │   └── 📄 user-query.dto.ts
│   │       ├── 📁 schemas/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 user.schema.ts
│   │       │   ├── 📄 user-settings.schema.ts
│   │       │   ├── 📄 user-keys.schema.ts
│   │       │   └── 📄 follow.schema.ts
│   │       ├── 📁 services/
│   │       │   ├── 📄 profile.service.ts
│   │       │   ├── 📄 settings.service.ts
│   │       │   ├── 📄 follow.service.ts
│   │       │   ├── 📄 block.service.ts
│   │       │   └── 📄 keys.service.ts
│   │       └── 📁 events/
│   │           ├── 📄 user.events.ts
│   │           └── 📄 user.publisher.ts
│   │
│   ├── 📁 post-service/               # Port: 3003
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 nest-cli.json
│   │   └── 📁 src/
│   │       ├── 📄 main.ts
│   │       ├── 📄 app.module.ts
│   │       ├── 📄 post.module.ts
│   │       ├── 📄 post.controller.ts
│   │       ├── 📄 post.service.ts
│   │       ├── 📁 config/
│   │       │   └── 📄 index.ts
│   │       ├── 📁 dto/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 create-post.dto.ts
│   │       │   ├── 📄 update-post.dto.ts
│   │       │   ├── 📄 post-query.dto.ts
│   │       │   ├── 📄 poll-vote.dto.ts
│   │       │   └── 📄 post-response.dto.ts
│   │       ├── 📁 schemas/
│   │       │   ├── 📄 index.ts
│   │       │   └── 📄 post.schema.ts
│   │       ├── 📁 services/
│   │       │   ├── 📄 post-crud.service.ts
│   │       │   ├── 📄 poll.service.ts
│   │       │   └── 📄 hashtag.service.ts
│   │       └── 📁 events/
│   │           ├── 📄 post.events.ts
│   │           └── 📄 post.publisher.ts
│   │
│   ├── 📁 feed-service/               # Port: 3004
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 nest-cli.json
│   │   └── 📁 src/
│   │       ├── 📄 main.ts
│   │       ├── 📄 app.module.ts
│   │       ├── 📄 feed.module.ts
│   │       ├── 📄 feed.controller.ts
│   │       ├── 📄 feed.service.ts
│   │       ├── 📁 config/
│   │       │   └── 📄 index.ts
│   │       ├── 📁 dto/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 feed-query.dto.ts
│   │       │   └── 📄 trending-query.dto.ts
│   │       ├── 📁 services/
│   │       │   ├── 📄 home-feed.service.ts
│   │       │   ├── 📄 explore-feed.service.ts
│   │       │   ├── 📄 trending.service.ts
│   │       │   └── 📄 feed-cache.service.ts
│   │       └── 📁 subscribers/
│   │           ├── 📄 post.subscriber.ts
│   │           └── 📄 interaction.subscriber.ts
│   │
│   ├── 📁 interaction-service/        # Port: 3005
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 nest-cli.json
│   │   └── 📁 src/
│   │       ├── 📄 main.ts
│   │       ├── 📄 app.module.ts
│   │       ├── 📄 interaction.module.ts
│   │       ├── 📄 interaction.controller.ts
│   │       ├── 📄 interaction.service.ts
│   │       ├── 📁 config/
│   │       │   └── 📄 index.ts
│   │       ├── 📁 dto/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 like.dto.ts
│   │       │   ├── 📄 comment.dto.ts
│   │       │   ├── 📄 repost.dto.ts
│   │       │   └── 📄 bookmark.dto.ts
│   │       ├── 📁 schemas/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 interaction.schema.ts
│   │       │   ├── 📄 comment.schema.ts
│   │       │   └── 📄 bookmark.schema.ts
│   │       ├── 📁 services/
│   │       │   ├── 📄 like.service.ts
│   │       │   ├── 📄 comment.service.ts
│   │       │   ├── 📄 repost.service.ts
│   │       │   └── 📄 bookmark.service.ts
│   │       └── 📁 events/
│   │           ├── 📄 interaction.events.ts
│   │           └── 📄 interaction.publisher.ts
│   │
│   ├── 📁 media-service/              # Port: 3006
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 nest-cli.json
│   │   └── 📁 src/
│   │       ├── 📄 main.ts
│   │       ├── 📄 app.module.ts
│   │       ├── 📄 media.module.ts
│   │       ├── 📄 media.controller.ts
│   │       ├── 📄 media.service.ts
│   │       ├── 📁 config/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 storage.config.ts
│   │       │   └── 📄 upload.config.ts
│   │       ├── 📁 dto/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 upload.dto.ts
│   │       │   └── 📄 media-response.dto.ts
│   │       ├── 📁 services/
│   │       │   ├── 📄 upload.service.ts
│   │       │   ├── 📄 image.service.ts
│   │       │   ├── 📄 video.service.ts
│   │       │   ├── 📄 thumbnail.service.ts
│   │       │   └── 📄 storage.service.ts
│   │       ├── 📁 processors/
│   │       │   ├── 📄 image.processor.ts
│   │       │   └── 📄 video.processor.ts
│   │       └── 📁 events/
│   │           └── 📄 media.publisher.ts
│   │
│   ├── 📁 message-service/            # Port: 3007
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 nest-cli.json
│   │   └── 📁 src/
│   │       ├── 📄 main.ts
│   │       ├── 📄 app.module.ts
│   │       ├── 📄 message.module.ts
│   │       ├── 📄 message.controller.ts     # HTTP endpoints
│   │       ├── 📄 message.gateway.ts        # WebSocket gateway
│   │       ├── 📄 message.service.ts
│   │       ├── 📁 config/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 redis.config.ts
│   │       │   └── 📄 socket.config.ts
│   │       ├── 📁 dto/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 send-message.dto.ts
│   │       │   ├── 📄 create-conversation.dto.ts
│   │       │   ├── 📄 message-query.dto.ts
│   │       │   └── 📄 message-response.dto.ts
│   │       ├── 📁 schemas/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 conversation.schema.ts
│   │       │   ├── 📄 message.schema.ts
│   │       │   └── 📄 messaging-settings.schema.ts
│   │       ├── 📁 services/
│   │       │   ├── 📄 conversation.service.ts
│   │       │   ├── 📄 message-crud.service.ts
│   │       │   ├── 📄 presence.service.ts
│   │       │   ├── 📄 typing.service.ts
│   │       │   └── 📄 delivery.service.ts
│   │       ├── 📁 guards/
│   │       │   └── 📄 ws-auth.guard.ts
│   │       └── 📁 events/
│   │           ├── 📄 socket.events.ts
│   │           └── 📄 message.publisher.ts
│   │
│   ├── 📁 notification-service/       # Port: 3008
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 nest-cli.json
│   │   └── 📁 src/
│   │       ├── 📄 main.ts
│   │       ├── 📄 app.module.ts
│   │       ├── 📄 notification.module.ts
│   │       ├── 📄 notification.controller.ts
│   │       ├── 📄 notification.service.ts
│   │       ├── 📁 config/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 fcm.config.ts
│   │       │   └── 📄 email.config.ts
│   │       ├── 📁 dto/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 notification-query.dto.ts
│   │       │   └── 📄 notification-settings.dto.ts
│   │       ├── 📁 schemas/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 notification.schema.ts
│   │       │   └── 📄 notification-settings.schema.ts
│   │       ├── 📁 services/
│   │       │   ├── 📄 push.service.ts
│   │       │   ├── 📄 email.service.ts
│   │       │   ├── 📄 in-app.service.ts
│   │       │   └── 📄 digest.service.ts
│   │       ├── 📁 templates/
│   │       │   ├── 📄 welcome.template.ts
│   │       │   ├── 📄 reset-password.template.ts
│   │       │   └── 📄 verify-email.template.ts
│   │       └── 📁 subscribers/
│   │           ├── 📄 user.subscriber.ts
│   │           ├── 📄 post.subscriber.ts
│   │           ├── 📄 interaction.subscriber.ts
│   │           └── 📄 message.subscriber.ts
│   │
│   ├── 📁 listing-service/            # Port: 3009 (Faz 2)
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 nest-cli.json
│   │   └── 📁 src/
│   │       ├── 📄 main.ts
│   │       ├── 📄 app.module.ts
│   │       ├── 📄 listing.module.ts
│   │       ├── 📄 listing.controller.ts
│   │       ├── 📄 listing.service.ts
│   │       ├── 📁 config/
│   │       │   └── 📄 index.ts
│   │       ├── 📁 dto/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 create-listing.dto.ts
│   │       │   ├── 📄 update-listing.dto.ts
│   │       │   ├── 📄 listing-query.dto.ts
│   │       │   └── 📄 listing-response.dto.ts
│   │       ├── 📁 schemas/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 listing.schema.ts
│   │       │   ├── 📄 listing-category.schema.ts
│   │       │   ├── 📄 listing-favorite.schema.ts
│   │       │   └── 📄 listing-settings.schema.ts
│   │       ├── 📁 services/
│   │       │   ├── 📄 listing-crud.service.ts
│   │       │   ├── 📄 category.service.ts
│   │       │   ├── 📄 search.service.ts
│   │       │   ├── 📄 favorite.service.ts
│   │       │   └── 📄 promotion.service.ts
│   │       └── 📁 events/
│   │           └── 📄 listing.publisher.ts
│   │
│   ├── 📁 dating-service/             # Port: 3010 (Faz 3)
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 nest-cli.json
│   │   └── 📁 src/
│   │       ├── 📄 main.ts
│   │       ├── 📄 app.module.ts
│   │       ├── 📄 dating.module.ts
│   │       ├── 📄 dating.controller.ts
│   │       ├── 📄 dating.service.ts
│   │       ├── 📁 config/
│   │       │   └── 📄 index.ts
│   │       ├── 📁 dto/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 dating-profile.dto.ts
│   │       │   ├── 📄 swipe.dto.ts
│   │       │   ├── 📄 discover-query.dto.ts
│   │       │   └── 📄 match-response.dto.ts
│   │       ├── 📁 schemas/
│   │       │   ├── 📄 index.ts
│   │       │   ├── 📄 dating-profile.schema.ts
│   │       │   ├── 📄 swipe.schema.ts
│   │       │   └── 📄 match.schema.ts
│   │       ├── 📁 services/
│   │       │   ├── 📄 profile.service.ts
│   │       │   ├── 📄 discover.service.ts
│   │       │   ├── 📄 swipe.service.ts
│   │       │   ├── 📄 match.service.ts
│   │       │   └── 📄 boost.service.ts
│   │       └── 📁 events/
│   │           └── 📄 dating.publisher.ts
│   │
│   └── 📁 admin-service/              # Port: 3011
│       ├── 📄 package.json
│       ├── 📄 tsconfig.json
│       ├── 📄 Dockerfile
│       ├── 📄 nest-cli.json
│       └── 📁 src/
│           ├── 📄 main.ts
│           ├── 📄 app.module.ts
│           ├── 📄 admin.module.ts
│           ├── 📄 admin.controller.ts
│           ├── 📄 admin.service.ts
│           ├── 📁 config/
│           │   └── 📄 index.ts
│           ├── 📁 dto/
│           │   ├── 📄 index.ts
│           │   ├── 📄 admin-login.dto.ts
│           │   ├── 📄 user-action.dto.ts
│           │   ├── 📄 report-action.dto.ts
│           │   └── 📄 feature-flag.dto.ts
│           ├── 📁 schemas/
│           │   ├── 📄 index.ts
│           │   ├── 📄 admin-user.schema.ts
│           │   ├── 📄 admin-log.schema.ts
│           │   ├── 📄 report.schema.ts
│           │   └── 📄 feature-flag.schema.ts
│           ├── 📁 services/
│           │   ├── 📄 dashboard.service.ts
│           │   ├── 📄 user-management.service.ts
│           │   ├── 📄 moderation.service.ts
│           │   ├── 📄 feature-flag.service.ts
│           │   └── 📄 audit-log.service.ts
│           └── 📁 guards/
│               ├── 📄 admin-auth.guard.ts
│               └── 📄 permission.guard.ts
│
├── 📁 packages/                       # Shared Packages
│   │
│   ├── 📁 shared-types/               # TypeScript types
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   └── 📁 src/
│   │       ├── 📄 index.ts
│   │       ├── 📁 entities/
│   │       │   ├── 📄 user.ts
│   │       │   ├── 📄 post.ts
│   │       │   ├── 📄 comment.ts
│   │       │   ├── 📄 conversation.ts
│   │       │   ├── 📄 message.ts
│   │       │   ├── 📄 notification.ts
│   │       │   ├── 📄 listing.ts
│   │       │   ├── 📄 dating-profile.ts
│   │       │   └── 📄 match.ts
│   │       ├── 📁 api/
│   │       │   ├── 📄 response.ts
│   │       │   ├── 📄 pagination.ts
│   │       │   └── 📄 error-codes.ts
│   │       ├── 📁 events/
│   │       │   ├── 📄 user.events.ts
│   │       │   ├── 📄 post.events.ts
│   │       │   ├── 📄 interaction.events.ts
│   │       │   ├── 📄 message.events.ts
│   │       │   └── 📄 notification.events.ts
│   │       └── 📁 constants/
│   │           ├── 📄 status.ts
│   │           └── 📄 limits.ts
│   │
│   ├── 📁 shared-utils/               # Utility functions
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   └── 📁 src/
│   │       ├── 📄 index.ts
│   │       ├── 📄 validators.ts
│   │       ├── 📄 formatters.ts
│   │       ├── 📄 helpers.ts
│   │       ├── 📄 hash.ts
│   │       └── 📄 date.ts
│   │
│   ├── 📁 shared-database/            # Database utilities
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   └── 📁 src/
│   │       ├── 📄 index.ts
│   │       ├── 📄 mongo.module.ts
│   │       ├── 📄 redis.module.ts
│   │       ├── 📄 redis.service.ts
│   │       └── 📁 schemas/
│   │           └── 📄 base.schema.ts
│   │
│   ├── 📁 shared-auth/                # Auth utilities
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   └── 📁 src/
│   │       ├── 📄 index.ts
│   │       ├── 📄 jwt.module.ts
│   │       ├── 📄 jwt.service.ts
│   │       ├── 📁 guards/
│   │       │   └── 📄 jwt-auth.guard.ts
│   │       ├── 📁 decorators/
│   │       │   ├── 📄 current-user.decorator.ts
│   │       │   └── 📄 public.decorator.ts
│   │       └── 📁 strategies/
│   │           └── 📄 jwt.strategy.ts
│   │
│   ├── 📁 shared-pubsub/              # Pub/Sub utilities
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   └── 📁 src/
│   │       ├── 📄 index.ts
│   │       ├── 📄 pubsub.module.ts
│   │       ├── 📄 publisher.service.ts
│   │       ├── 📄 subscriber.service.ts
│   │       └── 📁 topics/
│   │           ├── 📄 user.topic.ts
│   │           ├── 📄 post.topic.ts
│   │           ├── 📄 interaction.topic.ts
│   │           └── 📄 message.topic.ts
│   │
│   └── 📁 shared-logger/              # Logging utilities
│       ├── 📄 package.json
│       ├── 📄 tsconfig.json
│       └── 📁 src/
│           ├── 📄 index.ts
│           ├── 📄 logger.module.ts
│           ├── 📄 logger.service.ts
│           └── 📄 logger.interceptor.ts
│
├── 📁 infrastructure/                 # Terraform & K8s
│   │
│   ├── 📁 terraform/
│   │   ├── 📄 main.tf
│   │   ├── 📄 variables.tf
│   │   ├── 📄 outputs.tf
│   │   ├── 📁 modules/
│   │   │   ├── 📁 cloud-run/
│   │   │   │   ├── 📄 main.tf
│   │   │   │   ├── 📄 variables.tf
│   │   │   │   └── 📄 outputs.tf
│   │   │   ├── 📁 redis/
│   │   │   │   ├── 📄 main.tf
│   │   │   │   ├── 📄 variables.tf
│   │   │   │   └── 📄 outputs.tf
│   │   │   ├── 📁 pubsub/
│   │   │   │   ├── 📄 main.tf
│   │   │   │   ├── 📄 variables.tf
│   │   │   │   └── 📄 outputs.tf
│   │   │   ├── 📁 storage/
│   │   │   │   ├── 📄 main.tf
│   │   │   │   ├── 📄 variables.tf
│   │   │   │   └── 📄 outputs.tf
│   │   │   └── 📁 networking/
│   │   │       ├── 📄 main.tf
│   │   │       ├── 📄 variables.tf
│   │   │       └── 📄 outputs.tf
│   │   └── 📁 environments/
│   │       ├── 📄 dev.tfvars
│   │       ├── 📄 staging.tfvars
│   │       └── 📄 prod.tfvars
│   │
│   └── 📁 docker/
│       ├── 📄 Dockerfile.base          # Base image
│       └── 📄 Dockerfile.service       # Service template
│
├── 📁 scripts/                        # Utility scripts
│   ├── 📄 setup.sh                    # Initial setup
│   ├── 📄 generate-keys.sh            # JWT key generation
│   ├── 📄 seed-db.ts                  # Database seeding
│   ├── 📄 migrate.ts                  # Migration runner
│   └── 📄 deploy.sh                   # Deployment script
│
├── 📁 docs/                           # Documentation
│   ├── 📄 01-project-overview.md
│   ├── 📄 02-architecture.md
│   ├── 📄 03-database-schema.md
│   ├── 📄 04-api-contracts.md
│   ├── 📄 05-feature-flags.md
│   ├── 📄 06-deployment.md
│   ├── 📄 07-glossary.md
│   ├── 📄 08-websocket-events.md
│   └── 📄 09-flutter-structure.md
│
└── 📁 .github/                        # GitHub Actions
    └── 📁 workflows/
        ├── 📄 ci.yml                  # Lint, test, build
        ├── 📄 cd-staging.yml          # Deploy to staging
        └── 📄 cd-prod.yml             # Deploy to production
```

---

## Servis Portları

| Servis | Port | Açıklama |
|--------|------|----------|
| api-gateway | 3000 | Ana giriş noktası |
| auth-service | 3001 | Kimlik doğrulama |
| user-service | 3002 | Kullanıcı yönetimi |
| post-service | 3003 | Gönderi CRUD |
| feed-service | 3004 | Timeline/Explore |
| interaction-service | 3005 | Like/Comment/Repost |
| media-service | 3006 | Medya upload |
| message-service | 3007 | WebSocket/Mesajlaşma |
| notification-service | 3008 | Push/Email |
| listing-service | 3009 | İlan modülü (Faz 2) |
| dating-service | 3010 | Flört modülü (Faz 3) |
| admin-service | 3011 | Admin panel |

---

## Shared Packages

| Paket | Açıklama |
|-------|----------|
| @superapp/shared-types | TypeScript type definitions |
| @superapp/shared-utils | Utility functions |
| @superapp/shared-database | MongoDB/Redis modules |
| @superapp/shared-auth | JWT guards & decorators |
| @superapp/shared-pubsub | GCP Pub/Sub helpers |
| @superapp/shared-logger | Structured logging |

---

## Komutlar

```bash
# Kurulum
pnpm install

# Development
pnpm dev                    # Tüm servisleri başlat
pnpm dev --filter=auth-service  # Tek servis

# Build
pnpm build                  # Tüm servisleri build et
pnpm build --filter=auth-service

# Test
pnpm test                   # Tüm testler
pnpm test:e2e               # E2E testler

# Lint
pnpm lint                   # ESLint
pnpm format                 # Prettier

# Docker
docker-compose up -d        # Local development
docker-compose -f docker-compose.prod.yml up -d

# Deployment
pnpm deploy:staging
pnpm deploy:prod
```

---

## Environment Files

Her servis için `.env` dosyası:

```
apps/auth-service/.env
apps/user-service/.env
apps/post-service/.env
...
```

Root `.env` dosyası ortak değişkenler için kullanılır.
