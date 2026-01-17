import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Feed Service - Ana giriş noktası
 * Port: 3004
 * Sorumluluk: Home timeline, Explore feed, Trending
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3004);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Global prefix
  app.setGlobalPrefix('api');

  // API versiyonlama
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
  });

  // Swagger (sadece development ortamında)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Feed Service API')
      .setDescription('SuperApp Feed Service - Timeline ve Trending API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('feed', 'Feed işlemleri')
      .addTag('trending', 'Trending konular')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  
  console.log(`🚀 Feed Service çalışıyor: http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/docs`);
  console.log(`🌍 Ortam: ${nodeEnv}`);
}

bootstrap();
