import { registerAs } from '@nestjs/config';

/**
 * JWT Configuration
 *
 * Environment variables:
 * - JWT_PRIVATE_KEY: RSA private key (PEM format)
 * - JWT_PUBLIC_KEY: RSA public key (PEM format)
 * - JWT_REFRESH_SECRET: Refresh token secret
 * - JWT_ACCESS_TTL: Access token TTL (saniye)
 * - JWT_REFRESH_TTL: Refresh token TTL (saniye)
 */
export default registerAs('jwt', () => ({
  // RSA Keys (RS256)
  privateKey: process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  publicKey: process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n'),

  // Refresh token için ayrı secret
  refreshSecret: process.env.JWT_REFRESH_SECRET,

  // Token süreleri (saniye)
  accessTtl: parseInt(process.env.JWT_ACCESS_TTL || '900', 10), // 15 dakika
  refreshTtl: parseInt(process.env.JWT_REFRESH_TTL || '604800', 10), // 7 gün

  // Token metadata
  issuer: 'superapp-auth',
  audience: 'superapp-api',
}));
