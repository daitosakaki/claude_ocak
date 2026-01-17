import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListingQueryDto {
  @ApiPropertyOptional({ description: 'Pagination cursor' })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Sayfa başına kayıt', default: 20, minimum: 1, maximum: 50 })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;

  @ApiPropertyOptional({ description: 'Kategori yolu', example: 'vehicles/cars' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Şehir', example: 'İstanbul' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'İlçe', example: 'Kadıköy' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ description: 'Minimum fiyat', example: 100000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maksimum fiyat', example: 500000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Ürün durumu',
    enum: ['new', 'used'],
  })
  @IsEnum(['new', 'used'])
  @IsOptional()
  condition?: string;

  @ApiPropertyOptional({
    description: 'Sıralama alanı',
    enum: ['createdAt', 'price.amount', 'stats.viewsCount'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sıralama yönü',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Sadece öne çıkan ilanlar' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  promotedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Konum (lat,lng)', example: '41.0082,28.9784' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Mesafe (km)', example: 10 })
  @IsNumber()
  @Min(1)
  @Max(500)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  distance?: number;
}
