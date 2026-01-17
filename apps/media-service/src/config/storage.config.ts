/**
 * Storage Config
 *
 * Google Cloud Storage konfigürasyonu.
 */

import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  // GCS Bucket
  bucketName: process.env.GCS_BUCKET_NAME || 'superapp-media',

  // GCS Bölgesi
  location: process.env.GCS_LOCATION || 'europe-west1',

  // Dosya erişim tipi
  // 'private': Signed URL gerekli
  // 'public': Herkese açık
  accessType: process.env.GCS_ACCESS_TYPE || 'public',

  // Signed URL süresi (saniye)
  signedUrlExpiry: parseInt(process.env.GCS_SIGNED_URL_EXPIRY, 10) || 3600,

  // Cache-Control header
  cacheControl: process.env.GCS_CACHE_CONTROL || 'public, max-age=31536000',

  // CDN entegrasyonu
  cdnEnabled: process.env.CDN_ENABLED === 'true',
  cdnBaseUrl: process.env.CDN_BASE_URL,

  // Storage sınıfı
  // STANDARD, NEARLINE, COLDLINE, ARCHIVE
  storageClass: process.env.GCS_STORAGE_CLASS || 'STANDARD',
}));
