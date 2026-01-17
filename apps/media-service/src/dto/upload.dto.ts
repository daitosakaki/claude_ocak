/**
 * Upload DTOs
 *
 * Dosya yükleme için DTO'lar.
 */

import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Medya tipi
 */
export enum UploadType {
  IMAGE = 'image',
  VIDEO = 'video',
  VOICE = 'voice',
}

/**
 * Yükleme seçenekleri
 */
export class UploadOptionsDto {
  /**
   * Medya tipi (otomatik algılanır)
   */
  @IsOptional()
  @IsEnum(UploadType)
  type?: UploadType;

  /**
   * Resim kalitesi (1-100)
   * Sadece image için geçerli
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  quality?: number;

  /**
   * Maksimum genişlik (px)
   * Sadece image/video için geçerli
   */
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4096)
  @Transform(({ value }) => parseInt(value, 10))
  maxWidth?: number;

  /**
   * Maksimum yükseklik (px)
   * Sadece image/video için geçerli
   */
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4096)
  @Transform(({ value }) => parseInt(value, 10))
  maxHeight?: number;

  /**
   * Thumbnail oluştur
   */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  generateThumbnail?: boolean = true;

  /**
   * Blurhash hesapla
   * Sadece image için geçerli
   */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  generateBlurhash?: boolean = true;
}

/**
 * Dosya validasyon hataları
 */
export class FileValidationError {
  field: string;
  message: string;
}
