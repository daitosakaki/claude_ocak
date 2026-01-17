import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingMiddleware } from './middleware/logging.middleware';

/**
 * API Gateway Bootstrap
 *
 * Sorumluluklar:
 * - JWT token validation
 * - Request routing to services
 * - Rate limiting (IP + User based)
 * - Request/response logging
 * - CORS handling
 * - Request transformation
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('APIGateway');

  // NestJS uygulamasını oluştur
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ==================== SECURITY ====================

  // Helmet - Security headers
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS', '*').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Device-Id',
      'X-Platform',
      'X-App-Version',
      'X-Request-Id',
      'Accept-Language',
    ],
    exposedHeaders: [
      'X-Request-Id',
      'X-Response-Time',
      'X-Rate-Limit-Limit',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
    ],
    credentials: true,
    maxAge: 86400, // 24 saat
  });

  // ==================== COMPRESSION ====================

  app.use(compression());

  // ==================== VALIDATION ====================

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da olmayan alanları sil
      forbidNonWhitelisted: true, // DTO'da olmayan alan varsa hata
      transform: true, // Otomatik type dönüşümü
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: nodeEnv === 'production',
    }),
  );

  // ==================== FILTERS ====================

  app.useGlobalFilters(new HttpExceptionFilter());

  // ==================== GLOBAL PREFIX ====================

  // API versiyonlama
  app.setGlobalPrefix('v1', {
    exclude: ['health', 'health/ready', 'health/live'],
  });

  // ==================== SHUTDOWN ====================

  // Graceful shutdown
  app.enableShutdownHooks();

  // ==================== START ====================

  await app.listen(port);

  logger.log(`🚀 API Gateway çalışıyor: http://localhost:${port}`);
  logger.log(`📝 Environment: ${nodeEnv}`);
  logger.log(`🔗 Health check: http://localhost:${port}/health`);
}

bootstrap().catch((error) => {
  console.error('API Gateway başlatılamadı:', error);
  process.exit(1);
});
