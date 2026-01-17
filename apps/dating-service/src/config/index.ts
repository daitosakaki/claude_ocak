/**
 * Dating Service Konfigürasyonu
 * Tüm environment değişkenleri ve varsayılan değerler
 */
export default () => ({
  // Servis bilgileri
  service: {
    name: 'dating-service',
    port: parseInt(process.env.PORT || '3010', 10),
    env: process.env.NODE_ENV || 'development',
  },

  // Veritabanı ayarları
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    name: process.env.MONGODB_NAME || 'superapp',
  },

  // Redis ayarları
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  // JWT ayarları
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },

  // Dating modülü limitleri
  dating: {
    // Keşfet limitleri
    discover: {
      defaultLimit: 10,
      maxLimit: 50,
      maxDistance: 100, // km
    },

    // Swipe limitleri
    swipe: {
      freeDailyLimit: 50,
      premiumDailyLimit: -1, // sınırsız
      superLikeFreeDaily: 1,
      superLikePremiumDaily: 5,
    },

    // Boost ayarları
    boost: {
      durationMinutes: 30,
      cooldownHours: 24,
    },

    // Fotoğraf limitleri
    photos: {
      minRequired: 1,
      maxAllowed: 6,
    },

    // Prompts
    prompts: {
      maxCount: 3,
      maxLength: 200,
    },

    // Premium özellikler
    premiumFeatures: [
      'unlimited_likes',
      'rewind',
      'see_who_liked',
      'advanced_filters',
      'incognito_mode',
      'hide_age',
      'hide_distance',
      'passport',
      'top_picks',
      'read_receipts',
      'priority_likes',
    ],
  },

  // Pub/Sub topics
  pubsub: {
    topicPrefix: process.env.PUBSUB_TOPIC_PREFIX || 'dating',
    topics: {
      matchCreated: 'match.created',
      swipeReceived: 'swipe.received',
      superLikeReceived: 'swipe.superlike',
      profileUpdated: 'profile.updated',
      boostActivated: 'boost.activated',
    },
  },

  // Cache TTL değerleri (saniye)
  cache: {
    profile: 300, // 5 dakika
    discover: 60, // 1 dakika
    likes: 120, // 2 dakika
    boostStatus: 60, // 1 dakika
  },
});

/**
 * Swipe limitleri için tip tanımı
 */
export interface SwipeLimits {
  dailyLimit: number;
  superLikeLimit: number;
  remainingLikes: number;
  remainingSuperLikes: number;
  resetsAt: Date;
}

/**
 * Keşfet filtreleri için tip tanımı
 */
export interface DiscoverFilters {
  minAge: number;
  maxAge: number;
  maxDistance: number;
  genderPreference: string[];
}
