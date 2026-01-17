/**
 * Feed Service - Konfigürasyon
 */
export default () => ({
  // Servis bilgileri
  service: {
    name: 'feed-service',
    port: parseInt(process.env.PORT || '3004', 10),
  },

  // MongoDB bağlantı ayarları
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'superapp',
  },

  // Redis bağlantı ayarları
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: 'feed:',
  },

  // Cache TTL değerleri (saniye)
  cache: {
    homeFeedTtl: parseInt(process.env.HOME_FEED_CACHE_TTL || '60', 10),
    exploreFeedTtl: parseInt(process.env.EXPLORE_FEED_CACHE_TTL || '300', 10),
    userTimelineTtl: parseInt(process.env.USER_TIMELINE_CACHE_TTL || '120', 10),
    hashtagFeedTtl: parseInt(process.env.HASHTAG_FEED_CACHE_TTL || '120', 10),
    trendingTtl: parseInt(process.env.TRENDING_CACHE_TTL || '300', 10),
  },

  // Feed limitleri
  limits: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '50', 10),
    maxTrendingItems: parseInt(process.env.MAX_TRENDING_ITEMS || '20', 10),
  },

  // Diğer servis URL'leri
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    postService: process.env.POST_SERVICE_URL || 'http://localhost:3003',
    interactionService: process.env.INTERACTION_SERVICE_URL || 'http://localhost:3005',
  },

  // Pub/Sub ayarları
  pubsub: {
    projectId: process.env.GCP_PROJECT_ID || 'superapp-dev',
    postEventsTopic: process.env.POST_EVENTS_TOPIC || 'post-events',
    interactionEventsTopic: process.env.INTERACTION_EVENTS_TOPIC || 'interaction-events',
    feedSubscription: process.env.FEED_SUBSCRIPTION || 'feed-service-sub',
  },

  // HTTP client ayarları
  http: {
    timeout: parseInt(process.env.HTTP_TIMEOUT || '5000', 10),
    retries: parseInt(process.env.HTTP_RETRIES || '2', 10),
  },

  // CORS ayarları
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});

/**
 * Cache key pattern'leri
 */
export const CacheKeys = {
  // Home feed: feed:home:{userId}:{cursor}
  HOME_FEED: 'home',
  
  // Explore feed: feed:explore:{cursor}
  EXPLORE_FEED: 'explore',
  
  // User timeline: feed:user:{userId}:{cursor}
  USER_TIMELINE: 'user',
  
  // Hashtag feed: feed:hashtag:{tag}:{cursor}
  HASHTAG_FEED: 'hashtag',
  
  // Trending: feed:trending:{region}:{period}
  TRENDING: 'trending',
  
  // Following list: feed:following:{userId}
  FOLLOWING_LIST: 'following',
};

/**
 * Pub/Sub event tipleri
 */
export const EventTypes = {
  POST_CREATED: 'post.created',
  POST_UPDATED: 'post.updated',
  POST_DELETED: 'post.deleted',
  POST_LIKED: 'post.liked',
  POST_UNLIKED: 'post.unliked',
  POST_COMMENTED: 'post.commented',
  POST_REPOSTED: 'post.reposted',
  USER_FOLLOWED: 'user.followed',
  USER_UNFOLLOWED: 'user.unfollowed',
};

/**
 * Feed tipleri
 */
export enum FeedType {
  HOME = 'home',
  EXPLORE = 'explore',
  USER = 'user',
  HASHTAG = 'hashtag',
}

/**
 * Trending periyotları
 */
export enum TrendingPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}
