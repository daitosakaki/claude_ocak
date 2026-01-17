import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TrendingPeriod } from '../config';

/**
 * Trending Query DTO
 * Trending/gündem endpoint'i için sorgu parametreleri
 */
export class TrendingQueryDto {
  @ApiPropertyOptional({
    description: 'Bölge kodu (ISO 3166-1 alpha-2)',
    example: 'TR',
    default: 'TR',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  region?: string = 'TR';

  @ApiPropertyOptional({
    description: 'Zaman periyodu',
    enum: TrendingPeriod,
    default: TrendingPeriod.DAILY,
    example: 'daily',
  })
  @IsOptional()
  @IsEnum(TrendingPeriod)
  period?: TrendingPeriod = TrendingPeriod.DAILY;

  @ApiPropertyOptional({
    description: 'Sonuç sayısı',
    minimum: 1,
    maximum: 50,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Belirli bir kategoriye göre filtrele',
    example: 'technology',
  })
  @IsOptional()
  @IsString()
  category?: string;
}

/**
 * Trending Item tipi
 */
export enum TrendingType {
  HASHTAG = 'hashtag',
  TOPIC = 'topic',
  PERSON = 'person',
  EVENT = 'event',
}
