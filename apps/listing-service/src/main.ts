import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('ListingService');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

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
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Swagger API dokumentasyonu
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SuperApp Listing Service')
      .setDescription('İlan modülü API dokumentasyonu')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('listings', 'İlan CRUD işlemleri')
      .addTag('categories', 'Kategori işlemleri')
      .addTag('favorites', 'Favori işlemleri')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3009;
  await app.listen(port);

  logger.log(`🚀 Listing Service ${port} portunda çalışıyor`);
  logger.log(`📚 API Docs: http://localhost:${port}/docs`);
}

bootstrap();
