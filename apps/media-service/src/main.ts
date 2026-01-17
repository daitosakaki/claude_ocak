/**
 * Media Service - Ana Giriş Noktası
 *
 * Medya yükleme, işleme ve depolama servisi.
 * - Resim yükleme ve sıkıştırma
 * - Video transcoding
 * - Thumbnail oluşturma
 * - Cloud Storage entegrasyonu
 *
 * Port: 3006
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { LoggerService } from '@superapp/shared-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Logger
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Config
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3006);
  const env = configService.get<string>('NODE_ENV', 'development');

  // API Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validation Pipe - Global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da olmayan alanları sil
      forbidNonWhitelisted: true, // Bilinmeyen alan varsa hata ver
      transform: true, // Otomatik tip dönüşümü
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
  });

  // Graceful Shutdown
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(
    `🚀 Media Service çalışıyor: http://localhost:${port}`,
    'Bootstrap',
  );
  logger.log(`📁 Ortam: ${env}`, 'Bootstrap');
}

bootstrap();
