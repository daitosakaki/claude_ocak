import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Bildirim tipleri
 */
export enum NotificationTypeFilter {
  // Sosyal
  LIKE = 'like',
  DISLIKE = 'dislike',
  COMMENT = 'comment',
  REPLY = 'reply',
  MENTION = 'mention',
  
  // Takip
  FOLLOW = 'follow',
  FOLLOW_REQUEST = 'follow_request',
  FOLLOW_ACCEPTED = 'follow_accepted',
  
  // Paylaşım
  REPOST = 'repost',
  QUOTE = 'quote',
  
  // Mesaj
  MESSAGE = 'message',
  
  // Flört
  MATCH = 'match',
  
  // İlan
  LISTING_MESSAGE = 'listing_message',
  LISTING_FAVORITE = 'listing_favorite',
  
  // Sistem
  SYSTEM = 'system',
}

/**
 * Bildirim listesi sorgu parametreleri
 * 
 * Örnek kullanım:
 * GET /notifications?cursor=xxx&limit=20&type=like
 */
export class NotificationQueryDto {
  /**
   * Cursor (pagination için)
   * Son bildirim ID'si
   */
  @IsOptional()
  @IsString({ message: 'Cursor string olmalıdır' })
  cursor?: string;

  /**
   * Sayfa başına bildirim sayısı
   * Varsayılan: 20, Min: 1, Max: 50
   */
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: 'Limit tam sayı olmalıdır' })
  @Min(1, { message: 'Limit en az 1 olmalıdır' })
  @Max(50, { message: 'Limit en fazla 50 olabilir' })
  limit?: number = 20;

  /**
   * Bildirim tipi filtresi
   * Belirli bir tip için filtreleme yapar
   */
  @IsOptional()
  @IsEnum(NotificationTypeFilter, {
    message: 'Geçersiz bildirim tipi',
  })
  type?: NotificationTypeFilter;

  /**
   * Sadece okunmamış bildirimleri getir
   */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  unreadOnly?: boolean;
}
