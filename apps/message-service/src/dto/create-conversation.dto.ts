/**
 * Create Conversation DTO
 * Yeni sohbet oluşturma için gerekli alanlar
 */

import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// Sohbet tipleri
export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  LISTING = 'listing',
  DATING = 'dating',
}

// Grup bilgisi DTO
class GroupInfoDto {
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

// İlişkili kayıt DTO
class RelatedToDto {
  @IsEnum(['listing', 'match'])
  type: 'listing' | 'match';

  @IsString()
  id: string;
}

export class CreateConversationDto {
  /**
   * Katılımcı kullanıcı ID'leri
   * Direct: 1 kişi (karşı taraf)
   * Group: 2-49 kişi
   */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(49)
  @IsString({ each: true })
  participantIds: string[];

  /**
   * Sohbet tipi
   */
  @IsEnum(ConversationType)
  @IsOptional()
  type?: ConversationType = ConversationType.DIRECT;

  /**
   * Grup bilgisi (sadece group tipi için)
   */
  @ValidateNested()
  @Type(() => GroupInfoDto)
  @IsOptional()
  group?: GroupInfoDto;

  /**
   * İlişkili kayıt (listing veya dating match)
   */
  @ValidateNested()
  @Type(() => RelatedToDto)
  @IsOptional()
  relatedTo?: RelatedToDto;
}
