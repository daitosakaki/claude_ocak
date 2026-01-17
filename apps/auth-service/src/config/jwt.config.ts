import { registerAs } from '@nestjs/config';

/**
 * JWT Konfigürasyonu
 *
 * Access ve Refresh token ayarları
 *
 * Token Stratejisi:
 * - Access Token: Kısa ömürlü (15 dk), API istekleri için
 * - Refresh Token: Uzun ömürlü (7 gün), yeni access token almak için
 *
 * Güvenlik:
 * - RS256 algoritması (asymmetric) production'da önerilir
 * - HS256 (symmetric) development için kullanılabilir
 * - Refresh token rotation aktif (her yenilemede yeni token)
 */
export const jwtConfig = registerAs('jwt', () => ({
  // Access Token
  access: {
    secret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key',
    expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    algorithm: 'HS256' as const,
  },

  // Refresh Token
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    algorithm: 'HS256' as const,
  },

  // Token options
  options: {
    issuer: process.env.JWT_ISSUER || 'superapp',
    audience: process.env.JWT_AUDIENCE || 'superapp-users',
  },
}));

/**
 * JWT Payload tipi
 */
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * Refresh Token Payload tipi
 */
export interface RefreshTokenPayload extends JwtPayload {
  tokenVersion?: number; // Token rotation için
}

/**
 * Token response tipi
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Saniye cinsinden
}
