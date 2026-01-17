import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('AdminService');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3011);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Güvenlik middleware'leri
  app.use(helmet());

  // CORS ayarları - Admin panel için
  app.enableCors({
    origin: configService.get<string>('ADMIN_PANEL_URL', 'http://localhost:3100'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1/admin');

  // Global validation pipe
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

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger dokümantasyonu (sadece development'ta)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SuperApp Admin Service API')
      .setDescription('Admin panel, moderasyon ve feature flag yönetimi API\'si')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Admin JWT token',
          in: 'header',
        },
        'admin-auth',
      )
      .addTag('auth', 'Admin kimlik doğrulama')
      .addTag('dashboard', 'Dashboard istatistikleri')
      .addTag('users', 'Kullanıcı yönetimi')
      .addTag('moderation', 'İçerik moderasyonu')
      .addTag('reports', 'Şikayet yönetimi')
      .addTag('feature-flags', 'Feature flag yönetimi')
      .addTag('logs', 'Admin işlem logları')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  
  logger.log(`🚀 Admin Service ${nodeEnv} ortamında port ${port}'da çalışıyor`);
  logger.log(`📚 Swagger: http://localhost:${port}/docs`);
}

bootstrap();
