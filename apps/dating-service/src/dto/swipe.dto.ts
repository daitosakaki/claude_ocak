import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

/**
 * Swipe aksiyonları
 */
export enum SwipeAction {
  LIKE = 'like',
  PASS = 'pass',
  SUPERLIKE = 'superlike',
}

/**
 * Swipe işlemi için DTO
 */
export class SwipeDto {
  @ApiProperty({
    description: 'Hedef kullanıcı ID',
    example: 'user_456',
  })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    description: 'Swipe aksiyonu',
    enum: SwipeAction,
    example: SwipeAction.LIKE,
  })
  @IsEnum(SwipeAction)
  action: SwipeAction;
}

/**
 * Swipe sonuç DTO'su
 */
export class SwipeResultDto {
  @ApiProperty({ description: 'Swipe başarılı mı?' })
  success: boolean;

  @ApiProperty({ description: 'Eşleşme oluştu mu?' })
  isMatch: boolean;

  @ApiProperty({ description: 'Eşleşme ID (eğer match olduysa)' })
  matchId?: string;

  @ApiProperty({ description: 'Conversation ID (eğer match olduysa)' })
  conversationId?: string;

  @ApiProperty({ description: 'Kalan günlük like hakkı' })
  remainingLikes: number;

  @ApiProperty({ description: 'Kalan günlük super like hakkı' })
  remainingSuperLikes: number;
}

/**
 * Günlük swipe limiti bilgisi
 */
export class SwipeLimitsDto {
  @ApiProperty({ description: 'Günlük toplam like limiti' })
  dailyLimit: number;

  @ApiProperty({ description: 'Günlük super like limiti' })
  superLikeLimit: number;

  @ApiProperty({ description: 'Kalan like hakkı' })
  remainingLikes: number;

  @ApiProperty({ description: 'Kalan super like hakkı' })
  remainingSuperLikes: number;

  @ApiProperty({ description: 'Limitin sıfırlanacağı zaman' })
  resetsAt: Date;

  @ApiProperty({ description: 'Premium kullanıcı mı?' })
  isPremium: boolean;
}

/**
 * Swipe geçmişi sorgu DTO'su
 */
export class SwipeHistoryQueryDto {
  @ApiProperty({
    description: 'Cursor (pagination)',
    required: false,
  })
  cursor?: string;

  @ApiProperty({
    description: 'Limit',
    required: false,
    default: 20,
  })
  limit?: number;

  @ApiProperty({
    description: 'Aksiyon filtresi',
    enum: SwipeAction,
    required: false,
  })
  action?: SwipeAction;
}

/**
 * Rewind sonuç DTO'su
 */
export class RewindResultDto {
  @ApiProperty({ description: 'Rewind başarılı mı?' })
  success: boolean;

  @ApiProperty({ description: 'Geri alınan swipe' })
  rewindedSwipe?: {
    targetId: string;
    action: SwipeAction;
    swipedAt: Date;
  };

  @ApiProperty({ description: 'Kalan rewind hakkı' })
  remainingRewinds: number;

  @ApiProperty({ description: 'Hata mesajı (başarısız ise)' })
  error?: string;
}
