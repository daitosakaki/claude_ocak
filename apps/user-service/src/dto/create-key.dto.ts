import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

// E2EE public key oluşturma DTO
export class CreateKeyDto {
  @ApiProperty({
    description: 'Base64 encoded X25519 public key',
    example: 'MCowBQYDK2VuAyEA...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Public key boş olamaz' })
  publicKey: string;

  @ApiProperty({
    description: 'Cihaz ID',
    example: 'device_uuid_123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Device ID boş olamaz' })
  deviceId: string;

  @ApiPropertyOptional({
    description: 'Cihaz adı',
    example: 'iPhone 15 Pro',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;

  @ApiPropertyOptional({
    description: 'Platform',
    enum: Platform,
    example: 'ios',
  })
  @IsOptional()
  @IsEnum(Platform)
  platform?: Platform;
}

// Key yanıt DTO
export class KeyResponseDto {
  @ApiProperty({ example: 'key_123' })
  id: string;

  @ApiProperty({ example: 'device_uuid_123' })
  deviceId: string;

  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  deviceName?: string;

  @ApiPropertyOptional({ example: 'ios' })
  platform?: Platform;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

// Kullanıcı public key listesi DTO
export class UserKeysDto {
  @ApiProperty({ example: 'MCowBQYDK2VuAyEA...' })
  publicKey: string;

  @ApiProperty({ example: 'device_uuid_123' })
  deviceId: string;

  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  deviceName?: string;

  @ApiProperty({ example: true })
  isActive: boolean;
}
