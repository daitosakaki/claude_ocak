import { registerAs } from '@nestjs/config';

/**
 * Services Configuration
 * Downstream servis URL'leri ve ayarları
 *
 * Local development: localhost:port
 * Production: Cloud Run internal URLs
 */
export default registerAs('services', () => ({
  // ==================== AUTH SERVICE ====================
  auth: {
    name: 'auth-service',
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    timeout: parseInt(process.env.AUTH_SERVICE_TIMEOUT || '5000', 10),
    healthPath: '/health',
  },

  // ==================== USER SERVICE ====================
  user: {
    name: 'user-service',
    url: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    timeout: parseInt(process.env.USER_SERVICE_TIMEOUT || '5000', 10),
    healthPath: '/health',
  },

  // ==================== POST SERVICE ====================
  post: {
    name: 'post-service',
    url: process.env.POST_SERVICE_URL || 'http://localhost:3003',
    timeout: parseInt(process.env.POST_SERVICE_TIMEOUT || '5000', 10),
    healthPath: '/health',
  },

  // ==================== FEED SERVICE ====================
  feed: {
    name: 'feed-service',
    url: process.env.FEED_SERVICE_URL || 'http://localhost:3004',
    timeout: parseInt(process.env.FEED_SERVICE_TIMEOUT || '5000', 10),
    healthPath: '/health',
  },

  // ==================== INTERACTION SERVICE ====================
  interaction: {
    name: 'interaction-service',
    url: process.env.INTERACTION_SERVICE_URL || 'http://localhost:3005',
    timeout: parseInt(process.env.INTERACTION_SERVICE_TIMEOUT || '5000', 10),
    healthPath: '/health',
  },

  // ==================== MEDIA SERVICE ====================
  media: {
    name: 'media-service',
    url: process.env.MEDIA_SERVICE_URL || 'http://localhost:3006',
    timeout: parseInt(process.env.MEDIA_SERVICE_TIMEOUT || '60000', 10), // Upload için daha uzun
    healthPath: '/health',
  },

  // ==================== MESSAGE SERVICE ====================
  message: {
    name: 'message-service',
    url: process.env.MESSAGE_SERVICE_URL || 'http://localhost:3007',
    timeout: parseInt(process.env.MESSAGE_SERVICE_TIMEOUT || '5000', 10),
    healthPath: '/health',
    // WebSocket için ayrı URL olabilir
    wsUrl: process.env.MESSAGE_SERVICE_WS_URL || 'ws://localhost:3007',
  },

  // ==================== NOTIFICATION SERVICE ====================
  notification: {
    name: 'notification-service',
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008',
    timeout: parseInt(process.env.NOTIFICATION_SERVICE_TIMEOUT || '5000', 10),
    healthPath: '/health',
  },

  // ==================== LISTING SERVICE (Faz 2) ====================
  listing: {
    name: 'listing-service',
    url: process.env.LISTING_SERVICE_URL || 'http://localhost:3009',
    timeout: parseInt(process.env.LISTING_SERVICE_TIMEOUT || '5000', 10),
    healthPath: '/health',
    enabled: process.env.LISTING_SERVICE_ENABLED === 'true',
  },

  // ==================== DATING SERVICE (Faz 3) ====================
  dating: {
    name: 'dating-service',
    url: process.env.DATING_SERVICE_URL || 'http://localhost:3010',
    timeout: parseInt(process.env.DATING_SERVICE_TIMEOUT || '5000', 10),
    healthPath: '/health',
    enabled: process.env.DATING_SERVICE_ENABLED === 'true',
  },

  // ==================== ADMIN SERVICE ====================
  admin: {
    name: 'admin-service',
    url: process.env.ADMIN_SERVICE_URL || 'http://localhost:3011',
    timeout: parseInt(process.env.ADMIN_SERVICE_TIMEOUT || '5000', 10),
    healthPath: '/health',
  },
}));

/**
 * Route -> Service Mapping
 * Hangi route pattern'i hangi servise yönlendirilecek
 */
export const ROUTE_MAPPING: Record<string, string> = {
  // Auth
  '/v1/auth': 'auth',

  // User
  '/v1/users': 'user',

  // Post
  '/v1/posts': 'post',

  // Feed
  '/v1/feed': 'feed',
  '/v1/trending': 'feed',

  // Interaction
  '/v1/posts/:id/like': 'interaction',
  '/v1/posts/:id/dislike': 'interaction',
  '/v1/posts/:id/repost': 'interaction',
  '/v1/posts/:id/bookmark': 'interaction',
  '/v1/posts/:id/comments': 'interaction',
  '/v1/comments': 'interaction',
  '/v1/bookmarks': 'interaction',

  // Media
  '/v1/media': 'media',

  // Message
  '/v1/conversations': 'message',
  '/v1/messages': 'message',

  // Notification
  '/v1/notifications': 'notification',

  // Listing (Faz 2)
  '/v1/listings': 'listing',

  // Dating (Faz 3)
  '/v1/dating': 'dating',

  // Admin
  '/v1/admin': 'admin',

  // Config (herhangi bir servis veya gateway kendisi)
  '/v1/config': 'admin',
};
