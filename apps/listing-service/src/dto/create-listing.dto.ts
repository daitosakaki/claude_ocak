import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  MaxLength,
  Min,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== Alt DTO'lar ====================

export class CategoryDto {
  @ApiProperty({ description: 'Ana kategori', example: 'vehicles' })
  @IsString()
  main: string;

  @ApiPropertyOptional({ description: 'Alt kategori', example: 'cars' })
  @IsString()
  @IsOptional()
  sub?: string;

  @ApiProperty({ description: 'Kategori yolu', example: 'vehicles/cars/sedan' })
  @IsString()
  path: string;
}

export class PriceDto {
  @ApiProperty({ description: 'Fiyat miktarı', example: 250000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Para birimi', default: 'TRY', example: 'TRY' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Pazarlık durumu', default: false })
  @IsBoolean()
  @IsOptional()
  isNegotiable?: boolean;

  @ApiPropertyOptional({
    description: 'Fiyat tipi',
    enum: ['fixed', 'negotiable', 'free', 'contact'],
    default: 'fixed',
  })
  @IsEnum(['fixed', 'negotiable', 'free', 'contact'])
  @IsOptional()
  priceType?: string;
}

export class MediaItemDto {
  @ApiProperty({ description: 'Medya tipi', enum: ['image', 'video'] })
  @IsEnum(['image', 'video'])
  type: string;

  @ApiProperty({ description: 'Medya URL', example: 'https://cdn.../image.jpg' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Sıra numarası' })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Ana görsel mi?' })
  @IsBoolean()
  @IsOptional()
  isMain?: boolean;
}

export class LocationDto {
  @ApiPropertyOptional({ description: 'Koordinatlar [longitude, latitude]' })
  @IsArray()
  @IsOptional()
  coordinates?: number[];

  @ApiProperty({ description: 'Şehir', example: 'İstanbul' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ description: 'İlçe', example: 'Kadıköy' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ description: 'Mahalle' })
  @IsString()
  @IsOptional()
  neighborhood?: string;
}

export class ContactDto {
  @ApiPropertyOptional({ description: 'Telefon göster', default: true })
  @IsBoolean()
  @IsOptional()
  showPhone?: boolean;

  @ApiPropertyOptional({ description: 'Alternatif telefon' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'WhatsApp aktif', default: false })
  @IsBoolean()
  @IsOptional()
  whatsapp?: boolean;
}

// ==================== Ana DTO ====================

export class CreateListingDto {
  @ApiProperty({ description: 'İlan başlığı', example: 'BMW 320i 2020 Model' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: 'İlan açıklaması', example: 'Temiz kullanılmış, boyasız...' })
  @IsString()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ description: 'Kategori bilgisi', type: CategoryDto })
  @ValidateNested()
  @Type(() => CategoryDto)
  category: CategoryDto;

  @ApiProperty({ description: 'Fiyat bilgisi', type: PriceDto })
  @ValidateNested()
  @Type(() => PriceDto)
  price: PriceDto;

  @ApiPropertyOptional({
    description: 'Medya dosyaları (max 10)',
    type: [MediaItemDto],
  })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  @IsOptional()
  media?: MediaItemDto[];

  @ApiProperty({ description: 'Konum bilgisi', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({
    description: 'Kategori bazlı özellikler',
    example: { brand: 'BMW', model: '320i', year: 2020, km: 45000 },
  })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'İletişim bilgileri', type: ContactDto })
  @ValidateNested()
  @Type(() => ContactDto)
  @IsOptional()
  contact?: ContactDto;
}
