import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
} from 'class-validator';

/**
 * Login DTO
 *
 * Kullanıcı giriş isteği için gerekli alanlar
 *
 * @example
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "deviceId": "device_uuid_123",
 *   "deviceName": "iPhone 15 Pro",
 *   "platform": "ios"
 * }
 */
export class LoginDto {
  /**
   * Kullanıcı email adresi
   * @example "user@example.com"
   */
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  @IsNotEmpty({ message: 'Email alanı zorunludur' })
  email: string;

  /**
   * Kullanıcı şifresi
   * @example "SecurePass123!"
   */
  @IsString({ message: 'Şifre metin olmalıdır' })
  @IsNotEmpty({ message: 'Şifre alanı zorunludur' })
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  password: string;

  /**
   * Cihaz benzersiz kimliği (opsiyonel)
   * Multi-device oturum yönetimi için
   * @example "device_uuid_123"
   */
  @IsString()
  @IsOptional()
  deviceId?: string;

  /**
   * Cihaz adı (opsiyonel)
   * Kullanıcıya gösterilecek cihaz ismi
   * @example "iPhone 15 Pro"
   */
  @IsString()
  @IsOptional()
  deviceName?: string;

  /**
   * Platform bilgisi (opsiyonel)
   * @example "ios"
   */
  @IsString()
  @IsOptional()
  @IsIn(['ios', 'android', 'web'], { message: 'Platform ios, android veya web olmalıdır' })
  platform?: 'ios' | 'android' | 'web';
}
