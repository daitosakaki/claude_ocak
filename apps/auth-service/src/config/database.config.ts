import { registerAs } from '@nestjs/config';

/**
 * Database konfigürasyonu
 *
 * MongoDB ve Redis bağlantı ayarları
 */
export const databaseConfig = registerAs('database', () => ({
  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/superapp',
    dbName: process.env.MONGODB_DB_NAME || 'superapp',
    options: {
      // Connection pooling
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
      // Timeouts
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT || '10000', 10),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000', 10),
      // Retry
      retryWrites: true,
      retryReads: true,
    },
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    // TLS (production için)
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    // Retry strategy
    retryStrategy: (times: number) => {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 200, 2000); // Exponential backoff
    },
  },
}));

/**
 * Redis key prefix'leri
 * Tüm servislerde tutarlı key yapısı için
 */
export const REDIS_KEYS = {
  // Session & Auth
  SESSION: (userId: string, deviceId: string) => `session:${userId}:${deviceId}`,
  REFRESH_TOKEN: (token: string) => `refresh:${token}`,
  TOKEN_BLACKLIST: (token: string) => `blacklist:${token}`,

  // Verification tokens
  EMAIL_VERIFY: (token: string) => `email:verify:${token}`,
  PASSWORD_RESET: (token: string) => `password:reset:${token}`,

  // Rate limiting
  RATE_LIMIT_IP: (ip: string, endpoint: string) => `rate:ip:${ip}:${endpoint}`,
  RATE_LIMIT_USER: (userId: string, endpoint: string) => `rate:user:${userId}:${endpoint}`,

  // 2FA
  TWO_FACTOR_SECRET: (userId: string) => `2fa:secret:${userId}`,
  TWO_FACTOR_BACKUP: (userId: string) => `2fa:backup:${userId}`,
} as const;

/**
 * TTL değerleri (saniye cinsinden)
 */
export const TTL = {
  ACCESS_TOKEN: 15 * 60, // 15 dakika
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 gün
  EMAIL_VERIFICATION: 24 * 60 * 60, // 24 saat
  PASSWORD_RESET: 60 * 60, // 1 saat
  BLACKLIST: 15 * 60, // 15 dakika (access token süresi kadar)
  SESSION: 7 * 24 * 60 * 60, // 7 gün
} as const;
