import { Injectable, Logger } from '@nestjs/common';
import { GoogleStrategy, GoogleUser } from '../strategies/google.strategy';
import { AppleStrategy, AppleUser } from '../strategies/apple.strategy';

/**
 * OAuth Service
 *
 * Google ve Apple OAuth entegrasyonlarını yönetir
 *
 * Desteklenen Providers:
 * - Google Sign-In
 * - Sign in with Apple
 *
 * Flow:
 * 1. Client tarafında SDK ile login yapılır
 * 2. idToken backend'e gönderilir
 * 3. Token provider API'si ile doğrulanır
 * 4. Kullanıcı bilgileri döner
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly googleStrategy: GoogleStrategy,
    private readonly appleStrategy: AppleStrategy,
  ) {}

  /**
   * Google idToken'ı doğrula
   *
   * @param idToken - Google Sign-In'den alınan token
   * @returns Kullanıcı bilgileri veya null
   */
  async verifyGoogleToken(idToken: string): Promise<GoogleUser | null> {
    this.logger.log('Verifying Google token');
    const result = await this.googleStrategy.verifyToken(idToken);

    if (result) {
      this.logger.log(`Google token verified for: ${result.email}`);
    } else {
      this.logger.warn('Google token verification failed');
    }

    return result;
  }

  /**
   * Apple identityToken'ı doğrula
   *
   * @param identityToken - Sign in with Apple'dan alınan token
   * @returns Kullanıcı bilgileri veya null
   */
  async verifyAppleToken(identityToken: string): Promise<AppleUser | null> {
    this.logger.log('Verifying Apple token');
    const result = await this.appleStrategy.verifyToken(identityToken);

    if (result) {
      this.logger.log(`Apple token verified for user: ${result.id}`);
    } else {
      this.logger.warn('Apple token verification failed');
    }

    return result;
  }
}
