/**
 * Upload Config
 *
 * Dosya yükleme ve işleme konfigürasyonu.
 */

import { registerAs } from '@nestjs/config';

export default registerAs('upload', () => ({
  // ==================== GENEL ====================

  // Maksimum dosya boyutu (bytes)
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 100 * 1024 * 1024, // 100MB

  // Tek seferde max dosya sayısı
  maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST, 10) || 10,

  // ==================== RESİM ====================

  image: {
    // Maksimum boyutlar
    maxWidth: parseInt(process.env.IMAGE_MAX_WIDTH, 10) || 2048,
    maxHeight: parseInt(process.env.IMAGE_MAX_HEIGHT, 10) || 2048,

    // Kalite (1-100)
    quality: parseInt(process.env.IMAGE_QUALITY, 10) || 85,

    // Desteklenen formatlar
    allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'heic', 'heif'],

    // Çıktı formatı (null = aynı format)
    outputFormat: process.env.IMAGE_OUTPUT_FORMAT || null,

    // WebP'ye dönüştür
    convertToWebp: process.env.IMAGE_CONVERT_WEBP === 'true',

    // EXIF metadata'yı koru
    preserveExif: process.env.IMAGE_PRESERVE_EXIF !== 'false',

    // Otomatik döndürme (EXIF orientation)
    autoRotate: process.env.IMAGE_AUTO_ROTATE !== 'false',
  },

  // ==================== THUMBNAIL ====================

  thumbnail: {
    // Boyutlar
    width: parseInt(process.env.THUMB_WIDTH, 10) || 300,
    height: parseInt(process.env.THUMB_HEIGHT, 10) || 300,

    // Kalite
    quality: parseInt(process.env.THUMB_QUALITY, 10) || 80,

    // Fit modu: cover, contain, fill, inside, outside
    fit: process.env.THUMB_FIT || 'cover',

    // Format
    format: process.env.THUMB_FORMAT || 'jpeg',
  },

  // ==================== VIDEO ====================

  video: {
    // Maksimum çözünürlük
    maxWidth: parseInt(process.env.VIDEO_MAX_WIDTH, 10) || 1920,
    maxHeight: parseInt(process.env.VIDEO_MAX_HEIGHT, 10) || 1080,

    // Maksimum süre (saniye)
    maxDuration: parseInt(process.env.VIDEO_MAX_DURATION, 10) || 300, // 5 dakika

    // Bitrate'ler
    videoBitrate: process.env.VIDEO_BITRATE || '2500k',
    audioBitrate: process.env.VIDEO_AUDIO_BITRATE || '128k',

    // Codec'ler
    videoCodec: process.env.VIDEO_CODEC || 'libx264',
    audioCodec: process.env.VIDEO_AUDIO_CODEC || 'aac',

    // Preset (ultrafast, fast, medium, slow)
    preset: process.env.VIDEO_PRESET || 'medium',

    // CRF (Constant Rate Factor) - kalite (0-51, düşük=yüksek kalite)
    crf: parseInt(process.env.VIDEO_CRF, 10) || 23,

    // Desteklenen formatlar
    allowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],

    // Çıktı formatı
    outputFormat: process.env.VIDEO_OUTPUT_FORMAT || 'mp4',

    // Thumbnail frame zamanı
    thumbnailTime: process.env.VIDEO_THUMB_TIME || '00:00:01',
  },

  // ==================== SES ====================

  audio: {
    // Maksimum süre (saniye)
    maxDuration: parseInt(process.env.AUDIO_MAX_DURATION, 10) || 300, // 5 dakika

    // Bitrate
    bitrate: process.env.AUDIO_BITRATE || '128k',

    // Sample rate
    sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE, 10) || 44100,

    // Channels
    channels: parseInt(process.env.AUDIO_CHANNELS, 10) || 2,

    // Desteklenen formatlar
    allowedFormats: ['mp3', 'm4a', 'ogg', 'webm', 'wav'],

    // Çıktı formatı
    outputFormat: process.env.AUDIO_OUTPUT_FORMAT || 'aac',
  },

  // ==================== BLURHASH ====================

  blurhash: {
    // Bileşen sayısı (x, y)
    componentX: parseInt(process.env.BLURHASH_COMPONENT_X, 10) || 4,
    componentY: parseInt(process.env.BLURHASH_COMPONENT_Y, 10) || 3,
  },
}));
