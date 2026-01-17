import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Verify Email DTO
 *
 * Email doğrulama işlemi için token
 *
 * @example
 * {
 *   "token": "verification_token_from_email"
 * }
 */
export class VerifyEmailDto {
  /**
   * Email doğrulama token'ı
   * Kayıt sonrası gönderilen emaildeki token
   * @example "verification_token_from_email"
   */
  @IsString({ message: 'Token metin olmalıdır' })
  @IsNotEmpty({ message: 'Token alanı zorunludur' })
  token: string;
}
