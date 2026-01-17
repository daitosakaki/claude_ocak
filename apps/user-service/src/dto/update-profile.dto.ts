import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsEnum,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Kullanıcı adı (benzersiz)',
    example: 'johndoe',
    minLength: 3,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter olmalı' })
  @MaxLength(20, { message: 'Kullanıcı adı en fazla 20 karakter olabilir' })
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Kullanıcı adı sadece küçük harf, rakam ve alt çizgi içerebilir',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'Görünen ad',
    example: 'John Doe',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Görünen ad en fazla 50 karakter olabilir' })
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Profil fotoğrafı URL',
    example: 'https://cdn.example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Geçerli bir URL girin' })
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Kapak fotoğrafı URL',
    example: 'https://cdn.example.com/cover.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Geçerli bir URL girin' })
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Biyografi',
    example: 'Yazılım geliştirici | İstanbul',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Biyografi en fazla 500 karakter olabilir' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Web sitesi',
    example: 'https://example.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Geçerli bir URL girin' })
  website?: string;

  @ApiPropertyOptional({
    description: 'Cinsiyet',
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Hesap gizli mi',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
