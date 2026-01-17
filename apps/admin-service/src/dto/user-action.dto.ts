import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
  Min,
  Max,
  MaxLength,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Kullanıcı durumu enum
 */
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  DELETED = 'deleted',
}

/**
 * Kullanıcı listeleme sorgu parametreleri
 */
export class UserQueryDto {
  @ApiPropertyOptional({
    description: 'Sayfa numarası',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Sayfa başına kayıt sayısı',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Arama terimi (username, displayName, email)',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Kullanıcı durumu filtresi',
    enum: UserStatus,
    example: 'active',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Doğrulanmış kullanıcılar',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Premium kullanıcılar',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({
    description: 'Sıralama alanı',
    example: 'createdAt',
    enum: ['createdAt', 'lastSeenAt', 'stats.followersCount', 'stats.postsCount'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sıralama yönü',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Kayıt tarihinden sonra',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Kayıt tarihinden önce',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;
}

/**
 * Kullanıcı güncelleme isteği
 */
export class UserActionDto {
  @ApiPropertyOptional({
    description: 'Doğrulama durumu',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Gizli hesap durumu',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Abonelik planı',
    enum: ['free', 'premium', 'business'],
  })
  @IsOptional()
  @IsEnum(['free', 'premium', 'business'])
  subscriptionPlan?: string;

  @ApiPropertyOptional({
    description: 'Admin notu',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}

/**
 * Kullanıcı yasaklama isteği
 */
export class BanUserDto {
  @ApiProperty({
    description: 'Yasaklama nedeni',
    example: 'Topluluk kurallarını ihlal',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'Yasaklama nedeni zorunludur' })
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    description: 'Dahili not (kullanıcı görmez)',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalNote?: string;
}

/**
 * Kullanıcı askıya alma isteği
 */
export class SuspendUserDto {
  @ApiProperty({
    description: 'Askıya alma nedeni',
    example: 'Şüpheli aktivite',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'Askıya alma nedeni zorunludur' })
  @MaxLength(500)
  reason: string;

  @ApiProperty({
    description: 'Askı bitiş tarihi',
    example: '2024-02-01T00:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty({ message: 'Bitiş tarihi zorunludur' })
  suspendedUntil: string;

  @ApiPropertyOptional({
    description: 'Dahili not (kullanıcı görmez)',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalNote?: string;
}

/**
 * Kullanıcı listesi yanıtı
 */
export class UserListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'Kullanıcı listesi',
    type: 'array',
  })
  data: UserItemDto[];

  @ApiProperty({
    description: 'Sayfalama bilgisi',
  })
  pagination: PaginationDto;
}

/**
 * Kullanıcı listesi item'ı
 */
export class UserItemDto {
  @ApiProperty({ example: 'user_123' })
  id: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'https://cdn.../avatar.jpg' })
  avatar?: string;

  @ApiProperty({ example: false })
  isPrivate: boolean;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({
    example: {
      postsCount: 42,
      followersCount: 1234,
      followingCount: 567,
    },
  })
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };

  @ApiProperty({
    example: {
      plan: 'premium',
      expiresAt: '2025-01-15T00:00:00Z',
    },
  })
  subscription: {
    plan: string;
    expiresAt?: string;
  };

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  lastSeenAt?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: string;
}

/**
 * Sayfalama bilgisi
 */
export class PaginationDto {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasMore: boolean;
}
