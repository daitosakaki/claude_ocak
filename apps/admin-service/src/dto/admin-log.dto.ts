import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Admin işlem türleri
 */
export enum AdminAction {
  // Auth
  ADMIN_LOGIN = 'admin_login',
  ADMIN_LOGOUT = 'admin_logout',
  PASSWORD_CHANGED = 'password_changed',

  // User Management
  USER_BANNED = 'user_banned',
  USER_UNBANNED = 'user_unbanned',
  USER_SUSPENDED = 'user_suspended',
  USER_UNSUSPENDED = 'user_unsuspended',
  USER_VERIFIED = 'user_verified',
  USER_UNVERIFIED = 'user_unverified',
  USER_UPDATED = 'user_updated',

  // Content Moderation
  POST_DELETED = 'post_deleted',
  POST_HIDDEN = 'post_hidden',
  COMMENT_DELETED = 'comment_deleted',

  // Reports
  REPORT_RESOLVED = 'report_resolved',
  REPORT_DISMISSED = 'report_dismissed',

  // Feature Flags
  FLAG_CREATED = 'flag_created',
  FLAG_UPDATED = 'flag_updated',
  FLAG_DELETED = 'flag_deleted',

  // Admin Management
  ADMIN_CREATED = 'admin_created',
  ADMIN_UPDATED = 'admin_updated',

  // System
  SETTINGS_CHANGED = 'settings_changed',
}

/**
 * Hedef türleri
 */
export enum AdminLogTargetType {
  USER = 'user',
  POST = 'post',
  COMMENT = 'comment',
  LISTING = 'listing',
  REPORT = 'report',
  FLAG = 'flag',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

/**
 * Admin log listeleme sorgu parametreleri
 */
export class AdminLogQueryDto {
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
    default: 50,
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Admin ID filtresi',
  })
  @IsOptional()
  @IsString()
  adminId?: string;

  @ApiPropertyOptional({
    description: 'İşlem türü filtresi',
    enum: AdminAction,
  })
  @IsOptional()
  @IsEnum(AdminAction)
  action?: AdminAction;

  @ApiPropertyOptional({
    description: 'Hedef türü filtresi',
    enum: AdminLogTargetType,
  })
  @IsOptional()
  @IsEnum(AdminLogTargetType)
  targetType?: AdminLogTargetType;

  @ApiPropertyOptional({
    description: 'Hedef ID filtresi',
  })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({
    description: 'Başlangıç tarihi',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Bitiş tarihi',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

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
 * Admin log listesi yanıtı
 */
export class AdminLogListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'Log listesi',
    type: 'array',
  })
  data: AdminLogItemDto[];

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
 * Admin log item
 */
export class AdminLogItemDto {
  @ApiProperty({ example: 'log_123' })
  id: string;

  @ApiProperty({
    description: 'İşlemi yapan admin',
    example: {
      id: 'admin_456',
      email: 'admin@superapp.com',
      name: 'Admin User',
    },
  })
  admin: {
    id: string;
    email: string;
    name: string;
  };

  @ApiProperty({
    description: 'İşlem türü',
    enum: AdminAction,
    example: 'user_banned',
  })
  action: AdminAction;

  @ApiProperty({
    description: 'Hedef',
    example: {
      type: 'user',
      id: 'user_789',
    },
  })
  target: {
    type: AdminLogTargetType;
    id: string;
  };

  @ApiPropertyOptional({
    description: 'İşlem detayları',
    example: {
      before: { status: 'active' },
      after: { status: 'banned' },
      reason: 'Spam aktivitesi',
    },
  })
  details?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    reason?: string;
  };

  @ApiPropertyOptional({
    description: 'IP adresi',
    example: '192.168.1.1',
  })
  ip?: string;

  @ApiPropertyOptional({
    description: 'User agent',
    example: 'Mozilla/5.0...',
  })
  userAgent?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;
}

/**
 * Log oluşturma için iç kullanım
 */
export interface CreateAdminLogDto {
  adminId: string;
  action: string;
  target: {
    type: string;
    id: string;
  };
  details?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    reason?: string;
  };
  ip?: string;
  userAgent?: string;
}
