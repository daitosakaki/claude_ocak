/**
 * App Config
 *
 * Genel uygulama konfigürasyonu.
 */

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Ortam
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3006,
  serviceName: 'media-service',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // GCP
  gcpProjectId: process.env.GCP_PROJECT_ID,

  // CDN
  cdnBaseUrl: process.env.CDN_BASE_URL || 'https://cdn.superapp.com',

  // Temp klasörü
  tempDir: process.env.TEMP_DIR || '/tmp/uploads',
}));
