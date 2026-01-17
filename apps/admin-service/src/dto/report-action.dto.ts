import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Şikayet nedeni enum
 */
export enum ReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE = 'inappropriate',
  FAKE = 'fake',
  VIOLENCE = 'violence',
  HATE_SPEECH = 'hate_speech',
  SCAM = 'scam',
  OTHER = 'other',
}

/**
 * Şikayet durumu enum
 */
export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

/**
 * Şikayet hedef türü enum
 */
export enum ReportTargetType {
  USER = 'user',
  POST = 'post',
  COMMENT = 'comment',
  LISTING = 'listing',
  MESSAGE = 'message',
}

/**
 * Şikayet çözüm aksiyonu enum
 */
export enum ReportAction {
  NONE = 'none',
  WARNING = 'warning',
  CONTENT_REMOVED = 'content_removed',
  USER_SUSPENDED = 'user_suspended',
  USER_BANNED = 'user_banned',
}

/**
 * Şikayet listeleme sorgu parametreleri
 */
export class ReportQueryDto {
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
    description: 'Şikayet durumu',
    enum: ReportStatus,
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({
    description: 'Şikayet nedeni',
    enum: ReportReason,
  })
  @IsOptional()
  @IsEnum(ReportReason)
  reason?: ReportReason;

  @ApiPropertyOptional({
    description: 'Hedef türü',
    enum: ReportTargetType,
  })
  @IsOptional()
  @IsEnum(ReportTargetType)
  targetType?: ReportTargetType;

  @ApiPropertyOptional({
    description: 'Sıralama alanı',
    example: 'createdAt',
    enum: ['createdAt', 'status'],
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
}

/**
 * Şikayet çözümleme isteği
 */
export class ReportActionDto {
  @ApiProperty({
    description: 'Yeni durum',
    enum: ReportStatus,
    example: 'resolved',
  })
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  status: ReportStatus;

  @ApiProperty({
    description: 'Alınan aksiyon',
    enum: ReportAction,
    example: 'content_removed',
  })
  @IsEnum(ReportAction)
  @IsNotEmpty()
  action: ReportAction;

  @ApiPropertyOptional({
    description: 'Çözüm notu',
    example: 'İçerik topluluk kurallarını ihlal ettiği için kaldırıldı.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

/**
 * Şikayet listesi yanıtı
 */
export class ReportListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'Şikayet listesi',
    type: 'array',
  })
  data: ReportItemDto[];

  @ApiProperty({
    description: 'Sayfalama bilgisi',
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Şikayet listesi item'ı
 */
export class ReportItemDto {
  @ApiProperty({ example: 'report_123' })
  id: string;

  @ApiProperty({
    description: 'Şikayet eden kullanıcı',
    example: {
      id: 'user_456',
      username: 'reporter',
      displayName: 'Reporter User',
    },
  })
  reporter: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };

  @ApiProperty({
    description: 'Şikayet hedefi',
    example: {
      type: 'post',
      id: 'post_789',
    },
  })
  target: {
    type: ReportTargetType;
    id: string;
  };

  @ApiProperty({
    description: 'Şikayet nedeni',
    enum: ReportReason,
    example: 'spam',
  })
  reason: ReportReason;

  @ApiPropertyOptional({
    description: 'Ek açıklama',
    example: 'Bu içerik spam içeriyor.',
  })
  description?: string;

  @ApiProperty({
    description: 'Şikayet durumu',
    enum: ReportStatus,
    example: 'pending',
  })
  status: ReportStatus;

  @ApiPropertyOptional({
    description: 'Çözüm bilgisi',
    example: {
      action: 'content_removed',
      resolvedBy: 'admin_123',
      resolvedAt: '2024-01-15T12:00:00Z',
      notes: 'İçerik kaldırıldı',
    },
  })
  resolution?: {
    action: ReportAction;
    resolvedBy: string;
    resolvedAt: string;
    notes?: string;
  };

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;
}
