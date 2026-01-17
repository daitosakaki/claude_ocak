import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('DatingService');
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

  // Swagger dokümantasyonu
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SuperApp Dating Service')
      .setDescription('Flört modülü API dokümantasyonu')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('dating', 'Flört profili işlemleri')
      .addTag('discover', 'Keşfet işlemleri')
      .addTag('swipe', 'Swipe işlemleri')
      .addTag('matches', 'Eşleşme işlemleri')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  // Port
  const port = process.env.PORT || 3010;
  await app.listen(port);

  logger.log(`🚀 Dating Service çalışıyor: http://localhost:${port}`);
  logger.log(`📚 Swagger: http://localhost:${port}/docs`);
}

bootstrap();
