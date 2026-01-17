import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum WhoCanOption {
  EVERYONE = 'everyone',
  FOLLOWERS = 'followers',
  NONE = 'none',
}

export enum AutoPlayOption {
  ALWAYS = 'always',
  WIFI = 'wifi',
  NEVER = 'never',
}

export enum ThemeOption {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

// Privacy ayarları
export class PrivacySettingsDto {
  @ApiPropertyOptional({
    description: 'Kimler DM gönderebilir',
    enum: WhoCanOption,
    example: 'everyone',
  })
  @IsOptional()
  @IsEnum(WhoCanOption)
  whoCanDM?: WhoCanOption;

  @ApiPropertyOptional({
    description: 'Kimler etiketleyebilir',
    enum: WhoCanOption,
    example: 'everyone',
  })
  @IsOptional()
  @IsEnum(WhoCanOption)
  whoCanTag?: WhoCanOption;

  @ApiPropertyOptional({
    description: 'Takipçiler kimler tarafından görülebilir',
    enum: WhoCanOption,
    example: 'everyone',
  })
  @IsOptional()
  @IsEnum(WhoCanOption)
  whoCanSeeFollowers?: WhoCanOption;

  @ApiPropertyOptional({
    description: 'Aramadan gizle',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  hideFromSearch?: boolean;

  @ApiPropertyOptional({
    description: 'Rehberden gizle',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  hideFromContacts?: boolean;

  @ApiPropertyOptional({
    description: 'İki faktörlü doğrulama',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;
}

// İçerik ayarları
export class ContentSettingsDto {
  @ApiPropertyOptional({
    description: 'Hassas içerik filtresi',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  sensitiveContentFilter?: boolean;

  @ApiPropertyOptional({
    description: 'Sessize alınan kelimeler',
    example: ['spam', 'reklam'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mutedWords?: string[];

  @ApiPropertyOptional({
    description: 'İçerik dilleri',
    example: ['tr', 'en'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contentLanguages?: string[];

  @ApiPropertyOptional({
    description: 'Videoları otomatik oynat',
    enum: AutoPlayOption,
    example: 'wifi',
  })
  @IsOptional()
  @IsEnum(AutoPlayOption)
  autoPlayVideos?: AutoPlayOption;
}

// Görünüm ayarları
export class DisplaySettingsDto {
  @ApiPropertyOptional({
    description: 'Tema',
    enum: ThemeOption,
    example: 'system',
  })
  @IsOptional()
  @IsEnum(ThemeOption)
  theme?: ThemeOption;

  @ApiPropertyOptional({
    description: 'Dil',
    example: 'tr',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Veri tasarrufu modu',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  dataSaver?: boolean;

  @ApiPropertyOptional({
    description: 'Animasyonları azalt',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  reduceMotion?: boolean;

  @ApiPropertyOptional({
    description: 'Dokunsal geri bildirim',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  hapticFeedback?: boolean;
}

// Ana ayarlar DTO
export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description: 'Gizlilik ayarları',
    type: PrivacySettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PrivacySettingsDto)
  privacy?: PrivacySettingsDto;

  @ApiPropertyOptional({
    description: 'İçerik ayarları',
    type: ContentSettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContentSettingsDto)
  content?: ContentSettingsDto;

  @ApiPropertyOptional({
    description: 'Görünüm ayarları',
    type: DisplaySettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DisplaySettingsDto)
  display?: DisplaySettingsDto;
}
