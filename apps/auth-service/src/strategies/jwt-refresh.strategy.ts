import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RefreshTokenPayload } from '../config/jwt.config';

/**
 * JWT Refresh Strategy
 *
 * Refresh token doğrulama stratejisi
 *
 * Access token'dan farkları:
 * - Farklı secret key kullanır
 * - Daha uzun geçerlilik süresi
 * - Body'den token alır (header yerine)
 * - Token rotation için kullanılır
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      // Token'ı request body'den al
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),

      // Token süresi dolmuşsa hata fırlat
      ignoreExpiration: false,

      // Refresh token için ayrı secret
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),

      // Request'i validate fonksiyonuna geçir
      passReqToCallback: true,
    });
  }

  /**
   * Refresh token doğrulandıktan sonra çağrılır
   *
   * @param req - HTTP request (token'ı almak için)
   * @param payload - JWT payload
   */
  async validate(req: Request, payload: RefreshTokenPayload) {
    // Payload kontrolü
    if (!payload.userId) {
      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: 'Invalid refresh token payload',
      });
    }

    // Body'den refresh token'ı al
    const refreshToken = req.body?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: 'Refresh token is required',
      });
    }

    // Request.user'a atanacak değer
    return {
      userId: payload.userId,
      email: payload.email,
      refreshToken,
    };
  }
}
