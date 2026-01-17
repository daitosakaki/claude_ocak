import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Kullanıcı istatistikleri
export class UserStatsDto {
  @ApiProperty({ example: 42 })
  postsCount: number;

  @ApiProperty({ example: 1234 })
  followersCount: number;

  @ApiProperty({ example: 567 })
  followingCount: number;

  @ApiProperty({ example: 890 })
  likesCount: number;
}

// Abonelik bilgisi
export class SubscriptionDto {
  @ApiProperty({ example: 'free', enum: ['free', 'premium', 'business'] })
  plan: string;

  @ApiPropertyOptional({ example: '2025-01-15T00:00:00Z' })
  expiresAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-15T00:00:00Z' })
  subscribedAt?: Date;
}

// Doğrulama durumları
export class VerificationDto {
  @ApiProperty({ example: true })
  email: boolean;

  @ApiProperty({ example: false })
  phone: boolean;

  @ApiProperty({ example: false })
  identity: boolean;
}

// Modül durumları
export class ModulesDto {
  @ApiProperty({ example: false })
  dating: boolean;

  @ApiProperty({ example: false })
  listings: boolean;
}

// Kullanıcı yanıt DTO
export class UserResponseDto {
  @ApiProperty({ example: 'user_123' })
  id: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+905551234567' })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  avatar?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.jpg' })
  coverImage?: string;

  @ApiPropertyOptional({ example: 'Yazılım geliştirici | İstanbul' })
  bio?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  website?: string;

  @ApiProperty({ example: false })
  isPrivate: boolean;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ type: UserStatsDto })
  stats: UserStatsDto;

  @ApiProperty({ type: SubscriptionDto })
  subscription: SubscriptionDto;

  @ApiProperty({ type: VerificationDto })
  verification: VerificationDto;

  @ApiProperty({ type: ModulesDto })
  modules: ModulesDto;

  // İlişki durumları (diğer kullanıcıları görüntülerken)
  @ApiPropertyOptional({ example: true })
  isFollowing?: boolean;

  @ApiPropertyOptional({ example: false })
  isFollowedBy?: boolean;

  @ApiPropertyOptional({ example: false })
  isBlocked?: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;
}

// Liste için kısa kullanıcı DTO
export class UserSummaryDto {
  @ApiProperty({ example: 'user_123' })
  id: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  avatar?: string;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiPropertyOptional({ example: true })
  isFollowing?: boolean;

  @ApiPropertyOptional({ example: false })
  isFollowedBy?: boolean;
}

// Takip sonucu DTO
export class FollowResultDto {
  @ApiProperty({ example: 'following', enum: ['following', 'pending'] })
  status: 'following' | 'pending';
}

// Engellenen kullanıcı DTO
export class BlockedUserDto {
  @ApiProperty({ example: 'user_456' })
  id: string;

  @ApiProperty({ example: 'blockeduser' })
  username: string;

  @ApiProperty({ example: 'Blocked User' })
  displayName: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  avatar?: string;

  @ApiProperty({ example: '2024-01-10T00:00:00Z' })
  blockedAt: Date;
}
