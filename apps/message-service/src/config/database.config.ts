/**
 * Database Config
 * MongoDB bağlantı ayarları
 */

import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  // MongoDB URI
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  
  // Database adı
  name: process.env.MONGODB_NAME || 'superapp',

  // Bağlantı havuzu ayarları
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 10,
  minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) || 5,

  // Timeout ayarları
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,

  // Retry ayarları
  retryWrites: true,
  retryReads: true,

  // Write concern
  writeConcern: {
    w: 'majority',
    j: true,
  },

  // Read preference
  readPreference: 'primaryPreferred',
}));
