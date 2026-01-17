import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

/**
 * Admin giriş isteği
 */
export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin email adresi',
    example: 'admin@superapp.com',
  })
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  @IsNotEmpty({ message: 'Email zorunludur' })
  email: string;

  @ApiProperty({
    description: 'Admin şifresi',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Şifre zorunludur' })
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  password: string;

  @ApiPropertyOptional({
    description: 'IP adresi (otomatik alınır)',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ip?: string;
}

/**
 * Admin giriş yanıtı
 */
export class AdminLoginResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'Yanıt verisi',
    example: {
      admin: {
        id: 'admin_123',
        email: 'admin@superapp.com',
        name: 'Admin User',
        role: 'admin',
        permissions: ['users:read', 'users:write'],
      },
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresIn: 28800,
    },
  })
  data: {
    admin: AdminResponseDto;
    accessToken: string;
    expiresIn: number;
  };
}

/**
 * Admin bilgisi yanıtı
 */
export class AdminResponseDto {
  @ApiProperty({ example: 'admin_123' })
  id: string;

  @ApiProperty({ example: 'admin@superapp.com' })
  email: string;

  @ApiProperty({ example: 'Admin User' })
  name: string;

  @ApiPropertyOptional({ example: 'https://cdn.../avatar.jpg' })
  avatar?: string;

  @ApiProperty({
    example: 'admin',
    enum: ['super_admin', 'admin', 'moderator', 'support', 'analyst'],
  })
  role: string;

  @ApiProperty({
    example: ['users:read', 'users:write', 'posts:delete'],
    type: [String],
  })
  permissions: string[];
}

/**
 * Şifre değiştirme isteği
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mevcut şifre',
    example: 'OldPassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mevcut şifre zorunludur' })
  currentPassword: string;

  @ApiProperty({
    description: 'Yeni şifre',
    example: 'NewSecurePass456!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Yeni şifre zorunludur' })
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @MaxLength(50, { message: 'Şifre en fazla 50 karakter olabilir' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir',
    },
  )
  newPassword: string;

  @ApiProperty({
    description: 'Yeni şifre tekrarı',
    example: 'NewSecurePass456!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Şifre tekrarı zorunludur' })
  confirmPassword: string;
}
