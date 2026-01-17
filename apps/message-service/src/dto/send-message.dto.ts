/**
 * Send Message DTO
 * Mesaj gönderme için gerekli alanlar
 * E2EE destekli şifreli mesaj yapısı
 */

import {
  IsString,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// Mesaj tipleri
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  VOICE = 'voice',
  FILE = 'file',
  SYSTEM = 'system',
}

// Şifreli içerik DTO
class EncryptedContentDto {
  /**
   * Base64 encoded şifreli içerik
   */
  @IsString()
  @MaxLength(16384) // 16KB max
  content: string;

  /**
   * Base64 encoded nonce
   */
  @IsString()
  nonce: string;

  /**
   * Şifreleme algoritması
   */
  @IsString()
  @IsOptional()
  algorithm?: string = 'x25519-aes256gcm';
}

// Media bilgisi DTO
class MediaDto {
  /**
   * Media URL (CDN)
   */
  @IsString()
  url: string;

  /**
   * Thumbnail URL (resim/video için)
   */
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  /**
   * MIME tipi
   */
  @IsString()
  mimeType: string;

  /**
   * Dosya boyutu (bytes)
   */
  @IsNumber()
  size: number;

  /**
   * Genişlik (resim/video için)
   */
  @IsNumber()
  @IsOptional()
  width?: number;

  /**
   * Yükseklik (resim/video için)
   */
  @IsNumber()
  @IsOptional()
  height?: number;

  /**
   * Süre (ses/video için, saniye)
   */
  @IsNumber()
  @IsOptional()
  duration?: number;

  /**
   * Dosya adı
   */
  @IsString()
  @IsOptional()
  fileName?: string;
}

export class SendMessageDto {
  /**
   * Mesaj tipi
   */
  @IsEnum(MessageType)
  type: MessageType;

  /**
   * Şifreli içerik (E2EE)
   */
  @ValidateNested()
  @Type(() => EncryptedContentDto)
  encrypted: EncryptedContentDto;

  /**
   * Media bilgisi (image, video, voice, file için)
   */
  @ValidateNested()
  @Type(() => MediaDto)
  @IsOptional()
  media?: MediaDto;

  /**
   * Yanıt verilen mesaj ID'si
   */
  @IsString()
  @IsOptional()
  replyTo?: string;
}
