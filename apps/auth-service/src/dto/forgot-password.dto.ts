import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * Forgot Password DTO
 *
 * Şifre sıfırlama isteği için email adresi
 *
 * Güvenlik Notu:
 * - Email kayıtlı olmasa bile başarılı yanıt döner
 * - Bu, email enumeration saldırılarını önler
 *
 * @example
 * {
 *   "email": "user@example.com"
 * }
 */
export class ForgotPasswordDto {
  /**
   * Kayıtlı email adresi
   * Şifre sıfırlama linki bu adrese gönderilir
   * @example "user@example.com"
   */
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  @IsNotEmpty({ message: 'Email alanı zorunludur' })
  email: string;
}
