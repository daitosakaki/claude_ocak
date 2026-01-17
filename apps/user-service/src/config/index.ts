import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Servis bilgileri
  name: 'user-service',
  port: parseInt(process.env.PORT || '3002', 10),
  env: process.env.NODE_ENV || 'development',

  // Database
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    name: process.env.MONGODB_DB_NAME || 'superapp',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  // Pub/Sub
  pubsub: {
    projectId: process.env.GCP_PROJECT_ID || 'superapp-dev',
    topicName: 'user-events',
  },

  // JWT
  jwt: {
    publicKey: process.env.JWT_PUBLIC_KEY,
    issuer: process.env.JWT_ISSUER || 'superapp',
  },

  // Limitler
  limits: {
    maxBioLength: 500,
    maxDisplayNameLength: 50,
    maxUsernameLength: 20,
    minUsernameLength: 3,
    maxWebsiteLength: 200,
  },

  // Cache TTL (saniye)
  cache: {
    userTtl: 300, // 5 dakika
    settingsTtl: 300, // 5 dakika
    followingTtl: 300, // 5 dakika
    followersTtl: 300, // 5 dakika
  },
}));

// Config tiplerini export et
export interface AppConfig {
  name: string;
  port: number;
  env: string;
  database: {
    uri: string;
    name: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  pubsub: {
    projectId: string;
    topicName: string;
  };
  jwt: {
    publicKey?: string;
    issuer: string;
  };
  limits: {
    maxBioLength: number;
    maxDisplayNameLength: number;
    maxUsernameLength: number;
    minUsernameLength: number;
    maxWebsiteLength: number;
  };
  cache: {
    userTtl: number;
    settingsTtl: number;
    followingTtl: number;
    followersTtl: number;
  };
}
