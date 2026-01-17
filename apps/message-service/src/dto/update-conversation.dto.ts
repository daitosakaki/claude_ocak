/**
 * Update Conversation DTO
 * Sohbet güncelleme için gerekli alanlar
 */

import {
  IsBoolean,
  IsOptional,
  IsString,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Grup güncelleme DTO
class UpdateGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateConversationDto {
  /**
   * Arşivle/Arşivden çıkar
   */
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  /**
   * Sessize al/Sessize almayı kaldır
   */
  @IsBoolean()
  @IsOptional()
  isMuted?: boolean;

  /**
   * Sessize alma bitiş tarihi
   * null = Süresiz
   */
  @IsDateString()
  @IsOptional()
  mutedUntil?: string | null;

  /**
   * Grup bilgisi güncelleme (sadece grup sohbetleri için)
   */
  @ValidateNested()
  @Type(() => UpdateGroupDto)
  @IsOptional()
  group?: UpdateGroupDto;
}
