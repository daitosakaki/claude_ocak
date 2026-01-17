import {
  IsOptional,
  IsBoolean,
  IsString,
  IsEnum,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Platform tipleri
 */
export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

/**
 * Kanal ayarları DTO
 */
export class ChannelSettingsDto {
  @IsOptional()
  @IsBoolean({ message: 'Push ayarı boolean olmalıdır' })
  push?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Email ayarı boolean olmalıdır' })
  email?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'SMS ayarı boolean olmalıdır' })
  sms?: boolean;
}

/**
 * Sosyal bildirim ayarları DTO
 */
export class SocialSettingsDto {
  @IsOptional()
  @IsBoolean({ message: 'Likes ayarı boolean olmalıdır' })
  likes?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Comments ayarı boolean olmalıdır' })
  comments?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Mentions ayarı boolean olmalıdır' })
  mentions?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Follows ayarı boolean olmalıdır' })
  follows?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Reposts ayarı boolean olmalıdır' })
  reposts?: boolean;
}

/**
 * Mesaj bildirim ayarları DTO
 */
export class MessageSettingsDto {
  @IsOptional()
  @IsBoolean({ message: 'DirectMessages ayarı boolean olmalıdır' })
  directMessages?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'GroupMessages ayarı boolean olmalıdır' })
  groupMessages?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'MessageRequests ayarı boolean olmalıdır' })
  messageRequests?: boolean;
}

/**
 * Flört bildirim ayarları DTO
 */
export class DatingSettingsDto {
  @IsOptional()
  @IsBoolean({ message: 'Matches ayarı boolean olmalıdır' })
  matches?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Likes ayarı boolean olmalıdır' })
  likes?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'SuperLikes ayarı boolean olmalıdır' })
  superLikes?: boolean;
}

/**
 * İlan bildirim ayarları DTO
 */
export class ListingSettingsDto {
  @IsOptional()
  @IsBoolean({ message: 'Messages ayarı boolean olmalıdır' })
  messages?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'PriceDrops ayarı boolean olmalıdır' })
  priceDrops?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'SavedSearchAlerts ayarı boolean olmalıdır' })
  savedSearchAlerts?: boolean;
}

/**
 * Görüntüleme ayarları DTO
 */
export class DisplaySettingsDto {
  @IsOptional()
  @IsBoolean({ message: 'Sound ayarı boolean olmalıdır' })
  sound?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Vibration ayarı boolean olmalıdır' })
  vibration?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'ShowPreview ayarı boolean olmalıdır' })
  showPreview?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'BadgeCount ayarı boolean olmalıdır' })
  badgeCount?: boolean;
}

/**
 * Sessiz saatler DTO
 */
export class QuietHoursDto {
  @IsOptional()
  @IsBoolean({ message: 'Enabled ayarı boolean olmalıdır' })
  enabled?: boolean;

  @IsOptional()
  @IsString({ message: 'StartTime string olmalıdır' })
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'StartTime HH:MM formatında olmalıdır',
  })
  startTime?: string;

  @IsOptional()
  @IsString({ message: 'EndTime string olmalıdır' })
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'EndTime HH:MM formatında olmalıdır',
  })
  endTime?: string;
}

/**
 * Bildirim ayarları güncelleme DTO
 * 
 * Örnek kullanım:
 * PATCH /notifications/settings
 * {
 *   "channels": { "push": true, "email": false },
 *   "social": { "likes": false }
 * }
 */
export class UpdateNotificationSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelSettingsDto)
  channels?: ChannelSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialSettingsDto)
  social?: SocialSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessageSettingsDto)
  messages?: MessageSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DatingSettingsDto)
  dating?: DatingSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ListingSettingsDto)
  listings?: ListingSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DisplaySettingsDto)
  display?: DisplaySettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours?: QuietHoursDto;
}

/**
 * Cihaz kayıt DTO (FCM token)
 * 
 * Örnek kullanım:
 * POST /notifications/devices
 * {
 *   "token": "fcm_token_xxx",
 *   "deviceId": "device_uuid",
 *   "platform": "ios"
 * }
 */
export class RegisterDeviceDto {
  @IsString({ message: 'Token zorunludur' })
  token: string;

  @IsString({ message: 'DeviceId zorunludur' })
  deviceId: string;

  @IsEnum(Platform, { message: 'Geçersiz platform' })
  platform: Platform;

  @IsOptional()
  @IsString({ message: 'DeviceName string olmalıdır' })
  deviceName?: string;
}
