import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Config
import appConfig from './config/app.config';
import servicesConfig from './config/services.config';

// Modules
import { ProxyModule } from './proxy/proxy.module';
import { HealthModule } from './health/health.module';

// Middleware
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';

// Filters
import { HttpExceptionFilter } from './filters/http-exception.filter';

// Shared packages
// import { RedisModule } from '@superapp/shared-database';
// import { LoggerModule } from '@superapp/shared-logger';

/**
 * AppModule
 * API Gateway ana modülü
 *
 * Middleware sırası önemli:
 * 1. RequestIdMiddleware - Her request'e unique ID ata
 * 2. LoggingMiddleware - Request/response logla
 * 3. RateLimitMiddleware - Rate limiting uygula
 * 4. AuthMiddleware - JWT doğrulama (korumalı route'lar için)
 */
@Module({
  imports: [
    // ==================== CONFIG ====================
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, servicesConfig],
      envFilePath: ['.env.local', '.env'],
      cache: true,
      expandVariables: true,
    }),

    // ==================== REDIS ====================
    // RedisModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: (config: ConfigService) => ({
    //     host: config.get('REDIS_HOST', 'localhost'),
    //     port: config.get('REDIS_PORT', 6379),
    //     password: config.get('REDIS_PASSWORD'),
    //   }),
    //   inject: [ConfigService],
    // }),

    // ==================== LOGGER ====================
    // LoggerModule.forRoot({
    //   serviceName: 'api-gateway',
    // }),

    // ==================== FEATURES ====================
    HealthModule,
    ProxyModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // ==================== REQUEST ID (Tüm route'lar) ====================
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // ==================== LOGGING (Tüm route'lar) ====================
    consumer
      .apply(LoggingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // ==================== RATE LIMITING (Tüm route'lar) ====================
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // ==================== AUTH (Korumalı route'lar) ====================
    // Auth gerektirmeyen route'ları hariç tut
    consumer
      .apply(AuthMiddleware)
      .exclude(
        // Health check
        { path: 'health', method: RequestMethod.GET },
        { path: 'health/ready', method: RequestMethod.GET },
        { path: 'health/live', method: RequestMethod.GET },
        // Auth endpoints
        { path: 'v1/auth/login', method: RequestMethod.POST },
        { path: 'v1/auth/register', method: RequestMethod.POST },
        { path: 'v1/auth/refresh', method: RequestMethod.POST },
        { path: 'v1/auth/forgot-password', method: RequestMethod.POST },
        { path: 'v1/auth/reset-password', method: RequestMethod.POST },
        { path: 'v1/auth/verify-email', method: RequestMethod.POST },
        { path: 'v1/auth/oauth/google', method: RequestMethod.POST },
        { path: 'v1/auth/oauth/apple', method: RequestMethod.POST },
        // Public endpoints
        { path: 'v1/config', method: RequestMethod.GET },
        { path: 'v1/users/username/:username', method: RequestMethod.GET },
        { path: 'v1/posts/:id', method: RequestMethod.GET },
        { path: 'v1/feed/explore', method: RequestMethod.GET },
        { path: 'v1/trending', method: RequestMethod.GET },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
