import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GenderPreference } from './dating-profile.dto';

/**
 * Keşfet (Discover) sorgu parametreleri DTO'su
 */
export class DiscoverQueryDto {
  @ApiPropertyOptional({
    description: 'Getirilecek profil sayısı',
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Minimum yaş filtresi',
    minimum: 18,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  @Type(() => Number)
  minAge?: number;

  @ApiPropertyOptional({
    description: 'Maximum yaş filtresi',
    minimum: 18,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  @Type(() => Number)
  maxAge?: number;

  @ApiPropertyOptional({
    description: 'Maximum mesafe (km)',
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  maxDistance?: number;

  @ApiPropertyOptional({
    description: 'Cinsiyet tercihi filtresi',
    enum: GenderPreference,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(GenderPreference, { each: true })
  genderPreference?: GenderPreference[];

  @ApiPropertyOptional({
    description: 'Sadece doğrulanmış profiller',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  verifiedOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Sadece fotoğraflı profiller',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  withPhotosOnly?: boolean = true;
}

/**
 * Keşfet sonuç DTO'su
 */
export class DiscoverResultDto {
  @ApiPropertyOptional({ description: 'Bulunan profiller' })
  profiles: DiscoverProfileDto[];

  @ApiPropertyOptional({ description: 'Daha fazla profil var mı?' })
  hasMore: boolean;

  @ApiPropertyOptional({ description: 'Toplam profil sayısı (tahmini)' })
  estimatedTotal?: number;
}

/**
 * Keşfet ekranında gösterilecek profil DTO'su
 */
export class DiscoverProfileDto {
  @ApiPropertyOptional({ description: 'Kullanıcı ID' })
  userId: string;

  @ApiPropertyOptional({ description: 'Görünen isim' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Yaş' })
  age?: number;

  @ApiPropertyOptional({ description: 'Mesafe (km)' })
  distance?: number;

  @ApiPropertyOptional({ description: 'Biyografi' })
  bio: string;

  @ApiPropertyOptional({ description: 'Fotoğraflar' })
  photos: {
    url: string;
    order: number;
    isMain: boolean;
  }[];

  @ApiPropertyOptional({ description: 'Promptlar' })
  prompts?: {
    question: string;
    answer: string;
  }[];

  @ApiPropertyOptional({ description: 'Temel bilgiler' })
  basics?: {
    height?: number;
    work?: string;
    company?: string;
    education?: string;
    livingIn?: string;
  };

  @ApiPropertyOptional({ description: 'İlgi alanları' })
  interests?: string[];

  @ApiPropertyOptional({ description: 'Doğrulanmış profil mi?' })
  isVerified: boolean;

  @ApiPropertyOptional({ description: 'Son aktif olma zamanı' })
  lastActiveAt?: Date;

  @ApiPropertyOptional({ description: 'Ortak ilgi alanları' })
  commonInterests?: string[];
}

/**
 * Top Picks sorgu DTO'su
 */
export class TopPicksQueryDto {
  @ApiPropertyOptional({
    description: 'Getirilecek profil sayısı',
    minimum: 1,
    maximum: 10,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  limit?: number = 5;
}

/**
 * Top Picks sonuç DTO'su
 */
export class TopPicksResultDto {
  @ApiPropertyOptional({ description: 'Seçilmiş profiller' })
  picks: DiscoverProfileDto[];

  @ApiPropertyOptional({ description: 'Yenilenme zamanı' })
  refreshesAt: Date;

  @ApiPropertyOptional({ description: 'Premium özellik mi?' })
  isPremiumFeature: boolean;
}
