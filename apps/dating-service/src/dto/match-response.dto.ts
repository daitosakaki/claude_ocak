import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Eşleşme (Match) durumu
 */
export enum MatchStatus {
  ACTIVE = 'active',
  UNMATCHED = 'unmatched',
}

/**
 * Swipe yanıt DTO'su
 */
export class SwipeResponseDto {
  @ApiProperty({ description: 'İşlem başarılı mı?' })
  success: boolean;

  @ApiProperty({ description: 'Eşleşme oluştu mu?' })
  match: boolean;

  @ApiPropertyOptional({ description: 'Eşleşme ID (match olduysa)' })
  matchId?: string;

  @ApiPropertyOptional({ description: 'Conversation ID (match olduysa)' })
  conversationId?: string;
}

/**
 * Eşleşme (Match) yanıt DTO'su
 */
export class MatchResponseDto {
  @ApiProperty({ description: 'Eşleşme ID' })
  id: string;

  @ApiProperty({ description: 'Eşleşilen kullanıcı bilgileri' })
  user: MatchUserDto;

  @ApiProperty({ description: 'Sohbet ID' })
  conversationId: string;

  @ApiProperty({ description: 'Eşleşme durumu', enum: MatchStatus })
  status: MatchStatus;

  @ApiProperty({ description: 'Eşleşme tarihi' })
  matchedAt: Date;

  @ApiPropertyOptional({ description: 'Son mesaj bilgisi' })
  lastMessage?: {
    preview: string;
    sentAt: Date;
    isFromMe: boolean;
  };

  @ApiPropertyOptional({ description: 'Okunmamış mesaj sayısı' })
  unreadCount?: number;
}

/**
 * Eşleşme listesindeki kullanıcı bilgisi
 */
export class MatchUserDto {
  @ApiProperty({ description: 'Kullanıcı ID' })
  userId: string;

  @ApiProperty({ description: 'Görünen isim' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Yaş' })
  age?: number;

  @ApiProperty({ description: 'Profil fotoğrafı' })
  avatar: string;

  @ApiPropertyOptional({ description: 'Biyografi (kısa)' })
  bio?: string;

  @ApiProperty({ description: 'Doğrulanmış profil mi?' })
  isVerified: boolean;

  @ApiPropertyOptional({ description: 'Çevrimiçi durumu' })
  isOnline?: boolean;

  @ApiPropertyOptional({ description: 'Son görülme zamanı' })
  lastSeenAt?: Date;
}

/**
 * Eşleşme listesi yanıt DTO'su
 */
export class MatchListResponseDto {
  @ApiProperty({ description: 'Başarılı mı?' })
  success: boolean;

  @ApiProperty({ description: 'Eşleşmeler', type: [MatchResponseDto] })
  data: MatchResponseDto[];

  @ApiProperty({ description: 'Pagination bilgisi' })
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    total?: number;
  };
}

/**
 * Yeni eşleşme bildirimi DTO'su
 */
export class NewMatchNotificationDto {
  @ApiProperty({ description: 'Eşleşme ID' })
  matchId: string;

  @ApiProperty({ description: 'Eşleşilen kullanıcı' })
  user: MatchUserDto;

  @ApiProperty({ description: 'Sohbet ID' })
  conversationId: string;

  @ApiProperty({ description: 'Eşleşme zamanı' })
  matchedAt: Date;

  @ApiPropertyOptional({ description: 'Karşı taraf super like attı mı?' })
  wasSuperLike?: boolean;
}

/**
 * Unmatch (eşleşme kaldırma) sonuç DTO'su
 */
export class UnmatchResultDto {
  @ApiProperty({ description: 'İşlem başarılı mı?' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Hata mesajı (başarısız ise)' })
  error?: string;
}

/**
 * Eşleşme istatistikleri DTO'su
 */
export class MatchStatsDto {
  @ApiProperty({ description: 'Toplam eşleşme sayısı' })
  totalMatches: number;

  @ApiProperty({ description: 'Aktif eşleşme sayısı' })
  activeMatches: number;

  @ApiProperty({ description: 'Bu hafta eşleşme sayısı' })
  matchesThisWeek: number;

  @ApiProperty({ description: 'Super like ile eşleşme sayısı' })
  superLikeMatches: number;

  @ApiProperty({ description: 'Mesajlaşılan eşleşme sayısı' })
  conversationsStarted: number;
}
