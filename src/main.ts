import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters';

/**
 * Bootstrap Auth Service
 *
 * Servis ayarları:
 * - Port: 3001 (default)
 * - Global validation pipe
 * - Global exception filter
 * - Helmet (security headers)
 * - CORS
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // NestJS uygulamasını oluştur
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

  // ==================== Security ====================

  // Helmet - security headers
  app.use(helmet());

  // CORS - API Gateway'den gelen istekler için
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS')?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Device-Id',
      'X-Platform',
      'X-App-Version',
      'X-Request-Id',
      'Accept-Language',
    ],
    credentials: true,
  });

  // ==================== Validation ====================

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da olmayan alanları sil
      forbidNonWhitelisted: true, // Bilinmeyen alan varsa hata
      transform: true, // Otomatik type dönüşümü
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ==================== Exception Handling ====================

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ==================== API Prefix ====================

  // Eğer standalone çalışacaksa prefix ekle
  // API Gateway arkasında çalışırken gerekli değil
  if (configService.get<boolean>('USE_API_PREFIX')) {
    app.setGlobalPrefix('api/v1');
  }

  // ==================== Graceful Shutdown ====================

  app.enableShutdownHooks();

  // ==================== Start ====================

  await app.listen(port);

  logger.log(`🚀 Auth Service çalışıyor`);
  logger.log(`   Environment: ${nodeEnv}`);
  logger.log(`   Port: ${port}`);
  logger.log(`   URL: http://localhost:${port}`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Uygulama başlatılamadı', err);
  process.exit(1);
});
