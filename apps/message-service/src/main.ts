/**
 * Message Service - Ana giriş noktası
 * WebSocket ve HTTP endpoint'leri sağlayan mesajlaşma servisi
 * Port: 3007
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './adapters/redis-io.adapter';

async function bootstrap() {
  const logger = new Logger('MessageService');

  // NestJS uygulamasını oluştur
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da tanımlı olmayan alanları sil
      forbidNonWhitelisted: true, // Tanımsız alan varsa hata ver
      transform: true, // Otomatik tip dönüşümü
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS ayarları
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS', '*').split(','),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Redis Adapter (multi-instance WebSocket desteği)
  const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
  const redisPort = configService.get<number>('REDIS_PORT', 6379);
  const redisPassword = configService.get<string>('REDIS_PASSWORD');

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
  });
  app.useWebSocketAdapter(redisIoAdapter);

  // API prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'socket.io'],
  });

  // Port
  const port = configService.get<number>('PORT', 3007);

  await app.listen(port);
  logger.log(`🚀 Message Service başlatıldı - Port: ${port}`);
  logger.log(`📡 WebSocket hazır - ws://localhost:${port}`);
}

bootstrap();
