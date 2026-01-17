import { registerAs } from '@nestjs/config';

/**
 * App Configuration
 * Uygulama genel ayarları
 */
export default registerAs('app', () => ({
  // ==================== SERVER ====================
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // ==================== CORS ====================
  cors: {
    origins: (process.env.CORS_ORIGINS || '*').split(','),
  },

  // ==================== RATE LIMITING ====================
  rateLimit: {
    // IP bazlı limitler (dakika başına)
    ip: {
      unauthenticated: parseInt(process.env.RATE_LIMIT_IP_UNAUTH || '60', 10),
      authenticated: parseInt(process.env.RATE_LIMIT_IP_AUTH || '120', 10),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 dakika
    },
    // Kullanıcı bazlı limitler (dakika başına)
    user: {
      limit: parseInt(process.env.RATE_LIMIT_USER || '300', 10),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    },
    // Endpoint özel limitler
    endpoints: {
      // Auth endpoints - daha sıkı limitler
      'POST:/v1/auth/login': {
        limit: parseInt(process.env.RATE_LIMIT_LOGIN || '5', 10),
        windowMs: 60000,
      },
      'POST:/v1/auth/register': {
        limit: parseInt(process.env.RATE_LIMIT_REGISTER || '3', 10),
        windowMs: 60000,
      },
      'POST:/v1/auth/forgot-password': {
        limit: parseInt(process.env.RATE_LIMIT_FORGOT || '3', 10),
        windowMs: 60000,
      },
      // Post oluşturma
      'POST:/v1/posts': {
        limit: parseInt(process.env.RATE_LIMIT_POST || '30', 10),
        windowMs: 60000,
      },
      // Media upload
      'POST:/v1/media/upload': {
        limit: parseInt(process.env.RATE_LIMIT_UPLOAD || '20', 10),
        windowMs: 60000,
      },
    },
  },

  // ==================== TIMEOUTS ====================
  timeout: {
    default: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10), // 30 saniye
    upload: parseInt(process.env.UPLOAD_TIMEOUT || '120000', 10), // 2 dakika
  },

  // ==================== LOGGING ====================
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json', // json veya pretty
  },

  // ==================== REDIS ====================
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    keyPrefix: 'gateway:',
    ttl: {
      rateLimit: 60, // 1 dakika
      tokenBlacklist: 900, // 15 dakika (access token süresi)
    },
  },

  // ==================== JWT ====================
  jwt: {
    publicKey: process.env.JWT_PUBLIC_KEY,
    algorithm: 'RS256',
    issuer: process.env.JWT_ISSUER || 'superapp',
    audience: process.env.JWT_AUDIENCE || 'superapp-api',
  },

  // ==================== RETRY ====================
  retry: {
    maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || '2', 10),
    initialDelay: parseInt(process.env.RETRY_INITIAL_DELAY || '100', 10), // ms
    maxDelay: parseInt(process.env.RETRY_MAX_DELAY || '1000', 10), // ms
  },

  // ==================== CIRCUIT BREAKER ====================
  circuitBreaker: {
    failureThreshold: parseInt(process.env.CB_FAILURE_THRESHOLD || '5', 10),
    resetTimeout: parseInt(process.env.CB_RESET_TIMEOUT || '30000', 10), // 30 saniye
  },
}));
