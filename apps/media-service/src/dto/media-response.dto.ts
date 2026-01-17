/**
 * Media Response DTOs
 *
 * API response için DTO'lar.
 */

/**
 * Medya tipi enum
 */
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  VOICE = 'voice',
}

/**
 * Medya Response DTO
 *
 * Başarılı yükleme sonrası dönen veri.
 */
export class MediaResponseDto {
  /**
   * Benzersiz medya ID
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id: string;

  /**
   * Ana dosya URL'i (CDN)
   * @example "https://cdn.superapp.com/media/user123/abc123/main.jpg"
   */
  url: string;

  /**
   * Thumbnail URL'i (varsa)
   * @example "https://cdn.superapp.com/media/user123/abc123/thumb.jpg"
   */
  thumbnailUrl?: string;

  /**
   * Medya tipi
   * @example "image"
   */
  type: MediaType;

  /**
   * MIME tipi
   * @example "image/jpeg"
   */
  mimeType: string;

  /**
   * Dosya boyutu (bytes)
   * @example 245678
   */
  size: number;

  /**
   * Genişlik (px) - image/video için
   * @example 1080
   */
  width?: number;

  /**
   * Yükseklik (px) - image/video için
   * @example 720
   */
  height?: number;

  /**
   * Süre (saniye) - video/voice için
   * @example 30.5
   */
  duration?: number;

  /**
   * Blurhash - image için
   * @example "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
   */
  blurhash?: string;
}

/**
 * İşlenmiş resim verisi (internal)
 */
export interface ProcessedImage {
  buffer: Buffer;
  format: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
}

/**
 * İşlenmiş video verisi (internal)
 */
export interface ProcessedVideo {
  buffer: Buffer;
  format: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  duration: number;
}

/**
 * İşlenmiş ses verisi (internal)
 */
export interface ProcessedAudio {
  buffer: Buffer;
  format: string;
  mimeType: string;
  size: number;
  duration: number;
}

/**
 * Thumbnail verisi (internal)
 */
export interface ThumbnailData {
  buffer: Buffer;
  width: number;
  height: number;
}

/**
 * Video metadata (internal)
 */
export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  bitrate: number;
  codec: string;
  fps: number;
}
