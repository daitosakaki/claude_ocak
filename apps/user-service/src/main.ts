import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from '@superapp/shared-logger';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Logger
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Global prefix
  app.setGlobalPrefix('api');

  // Versioning
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

  // Exception filter
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('User Service API')
      .setDescription('SuperApp User Service - Kullanıcı profil, takip ve ayar yönetimi')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('users', 'Kullanıcı işlemleri')
      .addTag('profile', 'Profil işlemleri')
      .addTag('follow', 'Takip işlemleri')
      .addTag('settings', 'Ayar işlemleri')
      .addTag('keys', 'E2EE anahtar işlemleri')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3002;
  await app.listen(port);

  logger.log(`User Service çalışıyor: http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger: http://localhost:${port}/docs`, 'Bootstrap');
}

bootstrap();
