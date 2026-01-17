import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Feed sıralama seçenekleri
 */
export enum FeedSortBy {
  RECENT = 'recent',
  POPULAR = 'popular',
  RELEVANT = 'relevant',
}

/**
 * Feed Query DTO
 * Feed endpoint'leri için ortak sorgu parametreleri
 */
export class FeedQueryDto {
  @ApiPropertyOptional({
    description: 'Sayfalama cursor (önceki sayfanın son öğesinin ID\'si)',
    example: 'eyJpZCI6IjY1YjEyMzQ1Njc4OTBhYmNkZWYxMjM0NSJ9',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Sayfa başına gönderi sayısı',
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
    description: 'Sıralama kriteri',
    enum: FeedSortBy,
    default: FeedSortBy.RECENT,
    example: 'recent',
  })
  @IsOptional()
  @IsEnum(FeedSortBy)
  sortBy?: FeedSortBy = FeedSortBy.RECENT;

  @ApiPropertyOptional({
    description: 'Sadece medyalı gönderileri getir',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  mediaOnly?: boolean = false;

  @ApiPropertyOptional({
    description: 'Sadece anketli gönderileri getir',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  pollsOnly?: boolean = false;

  @ApiPropertyOptional({
    description: 'Repost\'ları dahil et',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeReposts?: boolean = true;

  @ApiPropertyOptional({
    description: 'Yanıtları dahil et',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeReplies?: boolean = false;
}

/**
 * User Timeline Query DTO
 * Kullanıcı timeline'ı için ek parametreler
 */
export class UserTimelineQueryDto extends FeedQueryDto {
  @ApiPropertyOptional({
    description: 'Sadece pinlenmiş gönderileri getir',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  pinnedOnly?: boolean = false;

  @ApiPropertyOptional({
    description: 'Medya galerisini getir (sadece medyalı gönderiler)',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  mediaGallery?: boolean = false;

  @ApiPropertyOptional({
    description: 'Beğenilen gönderileri getir',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  likedPosts?: boolean = false;
}
