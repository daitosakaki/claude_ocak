import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== Alt tipler ====================

export class CategoryResponse {
  @ApiProperty()
  main: string;

  @ApiPropertyOptional()
  sub?: string;

  @ApiProperty()
  path: string;
}

export class PriceResponse {
  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  isNegotiable: boolean;

  @ApiProperty()
  priceType: string;
}

export class MediaItemResponse {
  @ApiProperty()
  type: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  isMain: boolean;
}

export class LocationResponse {
  @ApiPropertyOptional()
  coordinates?: number[];

  @ApiProperty()
  city: string;

  @ApiPropertyOptional()
  district?: string;

  @ApiPropertyOptional()
  neighborhood?: string;
}

export class ContactResponse {
  @ApiProperty()
  showPhone: boolean;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  whatsapp: boolean;
}

export class StatsResponse {
  @ApiProperty()
  viewsCount: number;

  @ApiProperty()
  favoritesCount: number;

  @ApiProperty()
  messagesCount: number;
}

export class PromotionResponse {
  @ApiProperty()
  isPromoted: boolean;

  @ApiPropertyOptional()
  promotedUntil?: Date;

  @ApiPropertyOptional()
  promotionType?: string;
}

// ==================== Ana response ====================

export class ListingResponseDto {
  @ApiProperty({ description: 'İlan ID' })
  id: string;

  @ApiProperty({ description: 'Satıcı ID' })
  sellerId: string;

  @ApiProperty({ description: 'İlan başlığı' })
  title: string;

  @ApiProperty({ description: 'İlan açıklaması' })
  description: string;

  @ApiProperty({ description: 'Kategori bilgisi', type: CategoryResponse })
  category: CategoryResponse;

  @ApiProperty({ description: 'Fiyat bilgisi', type: PriceResponse })
  price: PriceResponse;

  @ApiPropertyOptional({ description: 'Medya dosyaları', type: [MediaItemResponse] })
  media?: MediaItemResponse[];

  @ApiProperty({ description: 'Konum bilgisi', type: LocationResponse })
  location: LocationResponse;

  @ApiPropertyOptional({ description: 'Kategori bazlı özellikler' })
  attributes?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'İletişim bilgileri', type: ContactResponse })
  contact?: ContactResponse;

  @ApiProperty({ description: 'İstatistikler', type: StatsResponse })
  stats: StatsResponse;

  @ApiPropertyOptional({ description: 'Promosyon bilgisi', type: PromotionResponse })
  promotion?: PromotionResponse;

  @ApiProperty({
    description: 'İlan durumu',
    enum: ['active', 'sold', 'expired', 'deleted', 'hidden'],
  })
  status: string;

  @ApiProperty({ description: 'Son geçerlilik tarihi' })
  expiresAt: Date;

  @ApiProperty({ description: 'Oluşturulma tarihi' })
  createdAt: Date;

  @ApiProperty({ description: 'Güncellenme tarihi' })
  updatedAt: Date;
}

// ==================== Sayfalı response ====================

export class PaginationInfo {
  @ApiProperty({ description: 'Daha fazla kayıt var mı?' })
  hasMore: boolean;

  @ApiPropertyOptional({ description: 'Sonraki sayfa cursor' })
  nextCursor?: string;

  @ApiProperty({ description: 'Sayfa başına kayıt' })
  limit: number;
}

export class PaginatedListingResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [ListingResponseDto] })
  data: ListingResponseDto[];

  @ApiProperty({ type: PaginationInfo })
  pagination: PaginationInfo;
}
