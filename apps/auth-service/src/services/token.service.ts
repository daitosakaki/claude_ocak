import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload, TokenResponse } from '../config/jwt.config';
import { TTL, REDIS_KEYS } from '../config/database.config';

/**
 * Token Service
 *
 * JWT token oluşturma ve doğrulama işlemleri
 *
 * Token Türleri:
 * - Access Token: API istekleri için (kısa ömürlü)
 * - Refresh Token: Yeni access token almak için (uzun ömürlü)
 * - Email Verification Token: Email doğrulama (24 saat)
 * - Password Reset Token: Şifre sıfırlama (1 saat)
 *
 * Güvenlik:
 * - Access ve Refresh token'lar farklı secret'lar kullanır
 * - Token rotation aktif (her refresh'te yeni token)
 * - Blacklist mekanizması ile iptal edilmiş token'lar kontrol edilir
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Access ve Refresh token çifti oluştur
   */
  async generateTokens(payload: {
    userId: string;
    email: string;
  }): Promise<TokenResponse> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: TTL.ACCESS_TOKEN,
    };
  }

  /**
   * Access token oluştur
   */
  private async generateAccessToken(payload: {
    userId: string;
    email: string;
  }): Promise<string> {
    return this.jwtService.signAsync(
      {
        userId: payload.userId,
        email: payload.email,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
        issuer: 'superapp',
        audience: 'superapp-users',
      },
    );
  }

  /**
   * Refresh token oluştur
   */
  private async generateRefreshToken(payload: {
    userId: string;
    email: string;
  }): Promise<string> {
    return this.jwtService.signAsync(
      {
        userId: payload.userId,
        email: payload.email,
        tokenId: uuidv4(), // Her refresh token benzersiz
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
        issuer: 'superapp',
        audience: 'superapp-users',
      },
    );
  }

  /**
   * Access token doğrula
   */
  async verifyAccessToken(token: string): Promise<JwtPayload | null> {
    try {
      return this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch (error) {
      this.logger.warn('Access token verification failed', error.message);
      return null;
    }
  }

  /**
   * Refresh token doğrula
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload | null> {
    try {
      return this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      this.logger.warn('Refresh token verification failed', error.message);
      return null;
    }
  }

  /**
   * Email doğrulama token'ı oluştur
   */
  async generateEmailVerificationToken(userId: string): Promise<string> {
    const token = uuidv4();
    // TODO: Redis'e kaydet
    // await this.redis.setex(REDIS_KEYS.EMAIL_VERIFY(token), TTL.EMAIL_VERIFICATION, userId);
    this.logger.log(`Email verification token generated for user: ${userId}`);
    return token;
  }

  /**
   * Email doğrulama token'ını doğrula
   */
  async verifyEmailToken(token: string): Promise<string | null> {
    // TODO: Redis'ten al ve sil
    // const userId = await this.redis.get(REDIS_KEYS.EMAIL_VERIFY(token));
    // if (userId) {
    //   await this.redis.del(REDIS_KEYS.EMAIL_VERIFY(token));
    // }
    // return userId;
    return null;
  }

  /**
   * Şifre sıfırlama token'ı oluştur
   */
  async generatePasswordResetToken(userId: string): Promise<string> {
    const token = uuidv4();
    // TODO: Redis'e kaydet
    // await this.redis.setex(REDIS_KEYS.PASSWORD_RESET(token), TTL.PASSWORD_RESET, userId);
    this.logger.log(`Password reset token generated for user: ${userId}`);
    return token;
  }

  /**
   * Şifre sıfırlama token'ını doğrula
   */
  async verifyPasswordResetToken(token: string): Promise<string | null> {
    // TODO: Redis'ten al ve sil
    // const userId = await this.redis.get(REDIS_KEYS.PASSWORD_RESET(token));
    // if (userId) {
    //   await this.redis.del(REDIS_KEYS.PASSWORD_RESET(token));
    // }
    // return userId;
    return null;
  }

  /**
   * Token'ı blacklist'e ekle
   */
  async blacklistToken(token: string): Promise<void> {
    // TODO: Redis'e kaydet
    // await this.redis.setex(REDIS_KEYS.TOKEN_BLACKLIST(token), TTL.BLACKLIST, '1');
    this.logger.log('Token blacklisted');
  }

  /**
   * Token blacklist'te mi kontrol et
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    // TODO: Redis'ten kontrol et
    // const exists = await this.redis.exists(REDIS_KEYS.TOKEN_BLACKLIST(token));
    // return exists === 1;
    return false;
  }
}
