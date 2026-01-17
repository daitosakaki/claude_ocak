export default () => ({
  // Uygulama ayarları
  port: parseInt(process.env.PORT || '3011', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB ayarları
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'superapp',
  },

  // Redis ayarları
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // Admin JWT ayarları
  jwt: {
    secret: process.env.ADMIN_JWT_SECRET || 'super-secret-admin-key-change-in-production',
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
  },

  // Admin panel URL (CORS için)
  adminPanelUrl: process.env.ADMIN_PANEL_URL || 'http://localhost:3100',

  // Rate limiting
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10),
    limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
});

// Tip tanımlamaları
export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
    dbName: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  adminPanelUrl: string;
  rateLimit: {
    ttl: number;
    limit: number;
  };
  logging: {
    level: string;
  };
}
