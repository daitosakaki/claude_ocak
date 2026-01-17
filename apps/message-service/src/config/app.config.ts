/**
 * App Config
 * Genel uygulama ayarları
 */

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Servis bilgileri
  name: 'message-service',
  port: parseInt(process.env.PORT, 10) || 3007,
  env: process.env.NODE_ENV || 'development',

  // API ayarları
  apiPrefix: 'api/v1',
  apiVersion: '1.0.0',

  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',

  // Rate limiting
  rateLimit: {
    messageSend: {
      limit: 60,
      windowMs: 60000, // 1 dakika
    },
    typingStart: {
      limit: 20,
      windowMs: 60000,
    },
    keysGet: {
      limit: 30,
      windowMs: 60000,
    },
  },

  // Mesaj limitleri
  limits: {
    maxMessageLength: 16384, // 16KB (şifreli içerik)
    maxMediaSize: 50 * 1024 * 1024, // 50MB
    maxParticipantsPerConversation: 50,
    maxConversationsPerUser: 1000,
  },
}));
