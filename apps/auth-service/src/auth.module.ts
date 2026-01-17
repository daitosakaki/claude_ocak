import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

// Controller
import { AuthController } from './auth.controller';

// Service
import { AuthService } from './auth.service';

// Alt servisler
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { OAuthService } from './services/oauth.service';

// Schemas
import { User, UserSchema } from './schemas/user.schema';
import { Session, SessionSchema } from './schemas/session.schema';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ThrottleGuard } from './guards/throttle.guard';

/**
 * Auth Modülü
 *
 * Kimlik doğrulama ile ilgili tüm bileşenleri içerir:
 * - JWT token yönetimi
 * - OAuth entegrasyonları
 * - Oturum yönetimi
 * - Şifre işlemleri
 */
@Module({
  imports: [
    // Passport modülü
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT modülü
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
        },
      }),
      inject: [ConfigService],
    }),

    // MongoDB schemas
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    // Ana servis
    AuthService,

    // Alt servisler
    TokenService,
    SessionService,
    PasswordService,
    OAuthService,

    // Strategies
    JwtStrategy,
    JwtRefreshStrategy,

    // Guards
    JwtAuthGuard,
    ThrottleGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    JwtAuthGuard,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
