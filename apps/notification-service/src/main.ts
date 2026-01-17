import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

/**
 * Notification Service Ana Başlatıcı
 * Port: 3008
 * Sorumluluklar:
 * - Push notifications (FCM)
 * - Email notifications
 * - In-app notifications
 * - Notification preferences
 * - Batch/digest notifications
 */
async function bootstrap() {
  const logger = new Logger('NotificationService');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3008);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation pipe - DTO validasyonu için
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da tanımlı olmayan alanları sil
      forbidNonWhitelisted: true, // Tanımsız alan gelirse hata ver
      transform: true, // Otomatik tip dönüşümü
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS ayarları
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  
  logger.log(`🔔 Notification Service çalışıyor: http://localhost:${port}`);
  logger.log(`📧 Email servisi aktif`);
  logger.log(`📱 Push notification servisi aktif`);
}

bootstrap();
