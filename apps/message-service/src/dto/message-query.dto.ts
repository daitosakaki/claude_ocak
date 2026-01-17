/**
 * Message Query DTO
 * Mesaj ve sohbet listeleme sorguları için
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class MessageQueryDto {
  /**
   * Cursor (pagination için)
   * Son mesaj/sohbet ID'si
   */
  @IsString()
  @IsOptional()
  cursor?: string;

  /**
   * Limit (sayfa boyutu)
   * Default: 50, Max: 100
   */
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 50;

  /**
   * Sıralama yönü
   * desc: Yeniden eskiye (default)
   * asc: Eskiden yeniye
   */
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  order?: 'asc' | 'desc' = 'desc';

  /**
   * Arşivlenmiş sohbetleri dahil et
   */
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeArchived?: boolean = false;

  /**
   * Belirli bir mesajdan sonraki mesajları getir
   * (sync için kullanılır)
   */
  @IsString()
  @IsOptional()
  after?: string;

  /**
   * Belirli bir mesajdan önceki mesajları getir
   */
  @IsString()
  @IsOptional()
  before?: string;
}

export class ConversationQueryDto extends MessageQueryDto {
  /**
   * Sohbet tipi filtresi
   */
  @IsEnum(['direct', 'group', 'listing', 'dating'])
  @IsOptional()
  type?: string;

  /**
   * Okunmamış sohbetleri filtrele
   */
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  unreadOnly?: boolean = false;
}
