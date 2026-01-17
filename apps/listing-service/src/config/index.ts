export default () => ({
  // Servis ayarları
  service: {
    name: 'listing-service',
    port: parseInt(process.env.PORT || '3009', 10),
    env: process.env.NODE_ENV || 'development',
  },

  // MongoDB
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/superapp',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  // Pub/Sub
  pubsub: {
    projectId: process.env.GCP_PROJECT_ID,
    topicName: 'listing-events',
  },

  // İlan ayarları
  listing: {
    // Varsayılan süre (gün)
    defaultExpiryDays: 30,
    // Maksimum fotoğraf sayısı
    maxPhotos: 10,
    // Maksimum video sayısı
    maxVideos: 2,
    // Fotoğraf boyutu (MB)
    maxPhotoSizeMB: 5,
    // Video boyutu (MB)
    maxVideoSizeMB: 50,
  },

  // Promosyon fiyatları (TL)
  promotion: {
    featured: {
      '7d': 50,
      '14d': 90,
      '30d': 150,
    },
    urgent: {
      '3d': 30,
    },
    bumpUp: 20,
  },

  // Cache TTL (saniye)
  cache: {
    listingTtl: 300, // 5 dakika
    categoryTtl: 3600, // 1 saat
    searchTtl: 60, // 1 dakika
  },
});
