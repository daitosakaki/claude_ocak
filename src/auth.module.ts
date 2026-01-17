import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema, Session, SessionSchema } from './schemas';

/**
 * Auth Module
 *
 * Kimlik doğrulama modülü.
 *
 * İçerir:
 * - Login endpoint
 * - JWT token oluşturma
 * - Session yönetimi
 * - Rate limiting
 */
@Module({
  imports: [
    // ==================== MongoDB Şemaları ====================
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),

    // ==================== JWT Modülü ====================
    // RS256 asymmetric encryption kullanılır
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        // Public key - token doğrulama için
        publicKey: configService.get<string>('JWT_PUBLIC_KEY'),
        // Private key - token imzalama için
        privateKey: configService.get<string>('JWT_PRIVATE_KEY'),
        signOptions: {
          algorithm: 'RS256',
          issuer: 'superapp-auth',
          audience: 'superapp-api',
        },
        verifyOptions: {
          algorithms: ['RS256'],
          issuer: 'superapp-auth',
          audience: 'superapp-api',
        },
      }),
      inject: [ConfigService],
    }),

    // ==================== Rate Limiting ====================
    // Brute force koruması
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 dakika (milisaniye)
        limit: 60, // Genel limit: 60 istek/dakika
      },
      {
        name: 'login',
        ttl: 60000,
        limit: 5, // Login için: 5 istek/dakika
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
