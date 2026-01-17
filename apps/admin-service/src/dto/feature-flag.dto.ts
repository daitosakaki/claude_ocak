import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  IsObject,
  Min,
  Max,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Feature flag kategorileri
 */
export enum FeatureFlagCategory {
  MESSAGING = 'messaging',
  SOCIAL = 'social',
  DATING = 'dating',
  LISTINGS = 'listings',
  PROFILE = 'profile',
  NOTIFICATIONS = 'notifications',
  PRIVACY = 'privacy',
  PREMIUM = 'premium',
  SYSTEM = 'system',
}

/**
 * Rollout ayarları
 */
export class RolloutDto {
  @ApiPropertyOptional({
    description: 'Yayılma yüzdesi (0-100)',
    minimum: 0,
    maximum: 100,
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number = 100;

  @ApiPropertyOptional({
    description: 'Beta kullanıcı ID listesi',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];
}

/**
 * İzin ayarları
 */
export class PermissionsDto {
  @ApiPropertyOptional({
    description: 'Ücretsiz kullanıcılar için aktif',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  free?: boolean = true;

  @ApiPropertyOptional({
    description: 'Premium kullanıcılar için aktif',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  premium?: boolean = true;

  @ApiPropertyOptional({
    description: 'Business kullanıcılar için aktif',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  business?: boolean = true;
}

/**
 * Kullanıcı ayarı
 */
export class UserSettingDto {
  @ApiPropertyOptional({
    description: 'Kullanıcı ayarı var mı',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasUserSetting?: boolean = false;

  @ApiPropertyOptional({
    description: 'Ayar anahtarı',
    example: 'showTypingIndicator',
  })
  @IsOptional()
  @IsString()
  settingKey?: string;

  @ApiPropertyOptional({
    description: 'Ayar etiketi (çoklu dil)',
    example: { tr: 'Yazıyor göstergesini göster', en: 'Show typing indicator' },
  })
  @IsOptional()
  @IsObject()
  settingLabel?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Varsayılan değer',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  defaultValue?: boolean;
}

/**
 * Feature flag listeleme sorgu parametreleri
 */
export class FeatureFlagQueryDto {
  @ApiPropertyOptional({
    description: 'Kategori filtresi',
    enum: FeatureFlagCategory,
  })
  @IsOptional()
  @IsEnum(FeatureFlagCategory)
  category?: FeatureFlagCategory;

  @ApiPropertyOptional({
    description: 'Aktif/pasif filtresi',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Arama terimi',
    example: 'typing',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * Feature flag oluşturma isteği
 */
export class CreateFeatureFlagDto {
  @ApiProperty({
    description: 'Benzersiz anahtar (snake_case)',
    example: 'msg_typing_indicator',
    pattern: '^[a-z][a-z0-9_]*$',
  })
  @IsString()
  @IsNotEmpty({ message: 'Key zorunludur' })
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'Key sadece küçük harf, rakam ve alt çizgi içerebilir',
  })
  key: string;

  @ApiProperty({
    description: 'Görünen isim',
    example: 'Typing Indicator',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name zorunludur' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Açıklama',
    example: 'Yazıyor göstergesini etkinleştirir',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Kategori',
    enum: FeatureFlagCategory,
    example: 'messaging',
  })
  @IsEnum(FeatureFlagCategory)
  category: FeatureFlagCategory;

  @ApiPropertyOptional({
    description: 'Aktif durumu',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean = false;

  @ApiPropertyOptional({
    description: 'Rollout ayarları',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RolloutDto)
  rollout?: RolloutDto;

  @ApiPropertyOptional({
    description: 'İzin ayarları',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionsDto)
  permissions?: PermissionsDto;

  @ApiPropertyOptional({
    description: 'Kullanıcı ayarı',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserSettingDto)
  userSetting?: UserSettingDto;

  @ApiPropertyOptional({
    description: 'Aktif bölgeler (* tümü)',
    example: ['TR', 'US'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[] = ['*'];

  @ApiPropertyOptional({
    description: 'Aktif platformlar',
    example: ['ios', 'android', 'web'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[] = ['ios', 'android', 'web'];
}

/**
 * Feature flag güncelleme isteği
 */
export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({
    description: 'Görünen isim',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Açıklama',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Aktif durumu',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Rollout ayarları',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RolloutDto)
  rollout?: RolloutDto;

  @ApiPropertyOptional({
    description: 'İzin ayarları',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionsDto)
  permissions?: PermissionsDto;

  @ApiPropertyOptional({
    description: 'Kullanıcı ayarı',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserSettingDto)
  userSetting?: UserSettingDto;

  @ApiPropertyOptional({
    description: 'Aktif bölgeler',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @ApiPropertyOptional({
    description: 'Aktif platformlar',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];
}

/**
 * Feature flag yanıtı
 */
export class FeatureFlagResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'Feature flag verisi',
  })
  data: {
    key: string;
    name: string;
    description?: string;
    category: FeatureFlagCategory;
    enabled: boolean;
    rollout: {
      percentage: number;
      userIds: string[];
    };
    permissions: {
      free: boolean;
      premium: boolean;
      business: boolean;
    };
    userSetting?: {
      hasUserSetting: boolean;
      settingKey?: string;
      settingLabel?: Record<string, string>;
      defaultValue?: boolean;
    };
    regions: string[];
    platforms: string[];
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
  };
}
