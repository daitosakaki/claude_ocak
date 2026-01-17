/**
 * Update Messaging Settings DTO
 * Mesajlaşma ayarları güncelleme
 */

import {
  IsBoolean,
  IsOptional,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Media indirme seçenekleri
export enum MediaAutoDownload {
  ALWAYS = 'always',
  WIFI = 'wifi',
  NEVER = 'never',
}

// Otomatik silme seçenekleri
export enum AutoDeleteMessages {
  OFF = 'off',
  HOURS_24 = '24h',
  DAYS_7 = '7d',
  DAYS_30 = '30d',
}

// Sessiz saatler DTO
class QuietHoursDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @IsOptional()
  startTime?: string; // "23:00" formatında

  @IsString()
  @IsOptional()
  endTime?: string; // "07:00" formatında
}

export class UpdateMessagingSettingsDto {
  /**
   * Çevrimiçi durumumu göster
   */
  @IsBoolean()
  @IsOptional()
  showOnlineStatus?: boolean;

  /**
   * Son görülme zamanımı göster
   */
  @IsBoolean()
  @IsOptional()
  showLastSeen?: boolean;

  /**
   * Yazıyor göstergesini göster
   */
  @IsBoolean()
  @IsOptional()
  showTypingIndicator?: boolean;

  /**
   * Okundu bilgisini göster
   */
  @IsBoolean()
  @IsOptional()
  showReadReceipts?: boolean;

  /**
   * Medya otomatik indirme
   */
  @IsEnum(MediaAutoDownload)
  @IsOptional()
  mediaAutoDownload?: MediaAutoDownload;

  /**
   * Mesajları otomatik sil (Premium)
   */
  @IsEnum(AutoDeleteMessages)
  @IsOptional()
  autoDeleteMessages?: AutoDeleteMessages;

  /**
   * Sessiz saatler
   */
  @ValidateNested()
  @Type(() => QuietHoursDto)
  @IsOptional()
  quietHours?: QuietHoursDto;
}
