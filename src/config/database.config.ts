import { registerAs } from '@nestjs/config';

/**
 * Database Configuration
 *
 * Environment variables:
 * - MONGODB_URI: MongoDB connection string
 * - MONGODB_DB_NAME: Database name
 */
export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: process.env.MONGODB_DB_NAME || 'superapp',

  // Connection options
  options: {
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
}));
