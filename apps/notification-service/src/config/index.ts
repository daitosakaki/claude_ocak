import { registerAs } from '@nestjs/config';

/**
 * Ana uygulama konfigürasyonu
 */
export default registerAs('app', () => ({
  // Servis ayarları
  port: parseInt(process.env.PORT, 10) || 3008,
  environment: process.env.NODE_ENV || 'development',
  serviceName: 'notification-service',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'superapp',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },

  // Pub/Sub
  pubsub: {
    projectId: process.env.GCP_PROJECT_ID,
    // Subscription'lar
    subscriptions: {
      userEvents: process.env.PUBSUB_USER_EVENTS_SUB || 'notification-user-events-sub',
      postEvents: process.env.PUBSUB_POST_EVENTS_SUB || 'notification-post-events-sub',
      interactionEvents: process.env.PUBSUB_INTERACTION_EVENTS_SUB || 'notification-interaction-events-sub',
      messageEvents: process.env.PUBSUB_MESSAGE_EVENTS_SUB || 'notification-message-events-sub',
    },
  },

  // Servis URL'leri (internal communication)
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  // Rate limiting
  rateLimit: {
    ttl: 60, // saniye
    limit: 100, // istek sayısı
  },

  // Digest ayarları
  digest: {
    dailyHour: parseInt(process.env.DIGEST_DAILY_HOUR, 10) || 9, // 09:00
    weeklyDay: parseInt(process.env.DIGEST_WEEKLY_DAY, 10) || 1, // Pazartesi
  },
}));

export { default as fcmConfig } from './fcm.config';
export { default as emailConfig } from './email.config';
