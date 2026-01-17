import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';

/**
 * Auth Service - Kimlik Doğrulama Servisi
 *
 * Sorumluluklar:
 * - Kullanıcı kaydı (register)
 * - Giriş/Çıkış (login/logout)
 * - OAuth (Google, Apple)
 * - JWT token yönetimi (access + refresh)
 * - Şifre sıfırlama
 * - Email doğrulama
 * - 2FA (TOTP)
 * - Oturum yönetimi
 */
async function bootstrap() {
  const logger = new Logger('AuthService');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS ayarları
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });

  // Global pipes - Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da olmayan alanları sil
      forbidNonWhitelisted: true, // Bilinmeyen alanlar için hata
      transform: true, // Otomatik tip dönüşümü
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters - Exception handling
  app.useGlobalFilters(new HttpExceptionFilter());

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3001);
  const host = configService.get<string>('HOST', '0.0.0.0');

  await app.listen(port, host);

  logger.log(`🚀 Auth Service running on http://${host}:${port}`);
  logger.log(`📝 Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('AuthService');
  logger.error('Failed to start Auth Service', error);
  process.exit(1);
});
