import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

/**
 * Google OAuth doğrulaması sonucu dönen kullanıcı bilgileri
 */
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

/**
 * Google OAuth Strategy
 *
 * Google Sign-In token doğrulaması
 *
 * Flow:
 * 1. Client (Flutter) Google SDK ile idToken alır
 * 2. idToken backend'e gönderilir
 * 3. Backend Google API ile token'ı doğrular
 * 4. Doğrulama başarılı ise kullanıcı bilgileri döner
 *
 * Gerekli Ayarlar:
 * - Google Cloud Console'da OAuth 2.0 Client ID oluştur
 * - iOS ve Android için ayrı client ID'ler gerekebilir
 * - Web için de ayrı client ID gerekir
 */
@Injectable()
export class GoogleStrategy {
  private readonly logger = new Logger(GoogleStrategy.name);
  private readonly client: OAuth2Client;
  private readonly clientIds: string[];

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

    this.client = new OAuth2Client(clientId);

    // Tüm geçerli client ID'leri (iOS, Android, Web)
    // Virgülle ayrılmış liste olabilir
    const clientIdsStr = this.configService.get<string>(
      'GOOGLE_CLIENT_IDS',
      clientId || '',
    );
    this.clientIds = clientIdsStr.split(',').map((id) => id.trim());
  }

  /**
   * Google idToken'ı doğrula
   *
   * @param idToken - Google Sign-In'den alınan ID token
   * @returns Doğrulanmış kullanıcı bilgileri veya null
   */
  async verifyToken(idToken: string): Promise<GoogleUser | null> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientIds,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        this.logger.warn('Google token payload is empty');
        return null;
      }

      // Email zorunlu
      if (!payload.email) {
        this.logger.warn('Google token does not contain email');
        return null;
      }

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
        emailVerified: payload.email_verified || false,
      };
    } catch (error) {
      this.logger.error('Google token verification failed', error);
      return null;
    }
  }
}
