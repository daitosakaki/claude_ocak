/**
 * Redis Config
 * Redis bağlantı ve cache ayarları
 */

import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  // Bağlantı ayarları
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,

  // Key prefix
  keyPrefix: 'msg:',

  // TTL değerleri (saniye)
  ttl: {
    // Online durumu
    online: 60, // 60 saniye, heartbeat ile yenilenir

    // Typing indicator
    typing: 3, // 3 saniye

    // Socket mapping
    socket: 86400, // 1 gün (session duration)

    // User conversations cache
    userConversations: 300, // 5 dakika

    // Public key cache
    publicKey: 3600, // 1 saat

    // Rate limit
    rateLimit: 60, // 1 dakika
  },

  // Key patterns
  keys: {
    online: (userId: string) => `online:${userId}`,
    socket: (socketId: string) => `socket:${socketId}`,
    typing: (convId: string, userId: string) => `typing:${convId}:${userId}`,
    userConversations: (userId: string) => `user:conversations:${userId}`,
    publicKey: (userId: string) => `pubkey:${userId}`,
    rateLimit: (userId: string, action: string) => `rate:${userId}:${action}`,
  },

  // Retry ayarları
  retryStrategy: (times: number) => {
    // Maximum 10 retry
    if (times > 10) {
      return null;
    }
    // Exponential backoff: 100ms, 200ms, 400ms, ...
    return Math.min(times * 100, 3000);
  },
}));
