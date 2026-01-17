import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

/**
 * Apple OAuth doğrulaması sonucu dönen kullanıcı bilgileri
 */
export interface AppleUser {
  id: string; // Apple user ID (sub claim)
  email?: string; // Sadece ilk girişte döner, sonra null olabilir
  name?: string; // Sadece ilk girişte döner
  emailVerified: boolean;
}

/**
 * Apple OAuth Strategy
 *
 * Sign in with Apple token doğrulaması
 *
 * Flow:
 * 1. Client (Flutter) Apple SDK ile identityToken alır
 * 2. identityToken backend'e gönderilir
 * 3. Backend Apple JWKS ile token'ı doğrular
 * 4. Doğrulama başarılı ise kullanıcı bilgileri döner
 *
 * Önemli Notlar:
 * - Apple email ve name bilgilerini SADECE ilk girişte döner
 * - Sonraki girişlerde bu bilgiler null olur
 * - Bu yüzden ilk girişte bu bilgileri kaydetmek önemli
 *
 * Gerekli Ayarlar:
 * - Apple Developer Console'da Service ID oluştur
 * - Sign in with Apple capability ekle
 * - Private key oluştur ve güvenli sakla
 */
@Injectable()
export class AppleStrategy {
  private readonly logger = new Logger(AppleStrategy.name);
  private readonly jwksUri = 'https://appleid.apple.com/auth/keys';
  private readonly issuer = 'https://appleid.apple.com';
  private readonly clientId: string;
  private readonly jwksClient: jwksClient.JwksClient;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('APPLE_CLIENT_ID') || '';

    // Apple JWKS client
    this.jwksClient = jwksClient({
      jwksUri: this.jwksUri,
      cache: true,
      cacheMaxAge: 86400000, // 24 saat
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  /**
   * Apple identityToken'ı doğrula
   *
   * @param identityToken - Sign in with Apple'dan alınan identity token
   * @returns Doğrulanmış kullanıcı bilgileri veya null
   */
  async verifyToken(identityToken: string): Promise<AppleUser | null> {
    try {
      // Token'ı decode et (doğrulamadan)
      const decoded = jwt.decode(identityToken, { complete: true });

      if (!decoded || typeof decoded === 'string') {
        this.logger.warn('Failed to decode Apple token');
        return null;
      }

      // Key ID'yi al
      const kid = decoded.header.kid;
      if (!kid) {
        this.logger.warn('Apple token does not contain kid');
        return null;
      }

      // Public key'i Apple'dan al
      const key = await this.getSigningKey(kid);
      if (!key) {
        this.logger.warn('Failed to get Apple signing key');
        return null;
      }

      // Token'ı doğrula
      const payload = jwt.verify(identityToken, key, {
        issuer: this.issuer,
        audience: this.clientId,
        algorithms: ['RS256'],
      }) as jwt.JwtPayload;

      if (!payload.sub) {
        this.logger.warn('Apple token does not contain sub');
        return null;
      }

      return {
        id: payload.sub,
        email: payload.email,
        name: undefined, // Apple token'da name yok, client'tan ayrı gelir
        emailVerified: payload.email_verified === 'true',
      };
    } catch (error) {
      this.logger.error('Apple token verification failed', error);
      return null;
    }
  }

  /**
   * Apple JWKS'den signing key al
   */
  private async getSigningKey(kid: string): Promise<string | null> {
    try {
      const key = await this.jwksClient.getSigningKey(kid);
      return key.getPublicKey();
    } catch (error) {
      this.logger.error('Failed to get Apple signing key', error);
      return null;
    }
  }
}
