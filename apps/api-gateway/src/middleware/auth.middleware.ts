import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * JWT Payload tipi
 */
interface JwtPayload {
  sub: string; // userId
  username: string;
  email: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti: string; // token ID
}

/**
 * AuthMiddleware
 * JWT token doğrulama
 *
 * Token formatı: Bearer <access_token>
 *
 * Doğrulama adımları:
 * 1. Authorization header kontrolü
 * 2. Token format kontrolü
 * 3. Token imza doğrulama (RS256)
 * 4. Token süre kontrolü
 * 5. Token blacklist kontrolü (Redis)
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);
  private readonly publicKey: string;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(private readonly configService: ConfigService) {
    this.publicKey = this.configService.get<string>('app.jwt.publicKey') || '';
    this.issuer = this.configService.get<string>('app.jwt.issuer') || 'superapp';
    this.audience =
      this.configService.get<string>('app.jwt.audience') || 'superapp-api';

    if (!this.publicKey) {
      this.logger.warn(
        'JWT_PUBLIC_KEY tanımlanmamış! Auth middleware çalışmayacak.',
      );
    }
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Authorization header kontrolü
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException('Authorization header gerekli');
      }

      // 2. Bearer token format kontrolü
      const [type, token] = authHeader.split(' ');

      if (type !== 'Bearer' || !token) {
        throw new UnauthorizedException('Geçersiz token formatı');
      }

      // 3. Token doğrulama
      const payload = await this.verifyToken(token);

      // 4. Request'e kullanıcı bilgilerini ekle
      req.userId = payload.sub;

      // 5. Downstream servisler için header ekle
      req.headers['x-user-id'] = payload.sub;
      req.headers['x-username'] = payload.username;

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Token doğrulama hatası: ${error}`);
      throw new UnauthorizedException('Geçersiz token');
    }
  }

  /**
   * JWT token doğrulama
   * RS256 algoritması ile imza doğrulama yapar
   */
  private async verifyToken(token: string): Promise<JwtPayload> {
    // Token parçalarına ayır
    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new UnauthorizedException('Geçersiz token yapısı');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // 1. Header kontrolü
    const header = JSON.parse(this.base64UrlDecode(headerB64));

    if (header.alg !== 'RS256') {
      throw new UnauthorizedException('Desteklenmeyen algoritma');
    }

    // 2. İmza doğrulama
    const signatureInput = `${headerB64}.${payloadB64}`;
    const signature = this.base64UrlToBuffer(signatureB64);

    const isValid = crypto.verify(
      'RSA-SHA256',
      Buffer.from(signatureInput),
      {
        key: this.publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      signature,
    );

    if (!isValid) {
      throw new UnauthorizedException('Geçersiz token imzası');
    }

    // 3. Payload parse
    const payload: JwtPayload = JSON.parse(this.base64UrlDecode(payloadB64));

    // 4. Expiration kontrolü
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException('Token süresi dolmuş');
    }

    // 5. Issuer ve audience kontrolü
    if (payload.iss !== this.issuer) {
      throw new UnauthorizedException('Geçersiz token issuer');
    }

    if (payload.aud !== this.audience) {
      throw new UnauthorizedException('Geçersiz token audience');
    }

    // 6. Blacklist kontrolü (Redis)
    // TODO: Redis entegrasyonu sonra eklenecek
    // const isBlacklisted = await this.redisService.get(`blacklist:${payload.jti}`);
    // if (isBlacklisted) {
    //   throw new UnauthorizedException('Token iptal edilmiş');
    // }

    return payload;
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(str: string): string {
    // Base64 URL -> Base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

    // Padding ekle
    while (base64.length % 4) {
      base64 += '=';
    }

    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  /**
   * Base64 URL to Buffer
   */
  private base64UrlToBuffer(str: string): Buffer {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

    while (base64.length % 4) {
      base64 += '=';
    }

    return Buffer.from(base64, 'base64');
  }
}
