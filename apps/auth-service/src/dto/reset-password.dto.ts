import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * Reset Password DTO
 *
 * Şifre sıfırlama işlemi için token ve yeni şifre
 *
 * @example
 * {
 *   "token": "reset_token_from_email",
 *   "password": "NewSecurePass123!"
 * }
 */
export class ResetPasswordDto {
  /**
   * Şifre sıfırlama token'ı
   * Email ile gönderilen linkte bulunan token
   * @example "reset_token_from_email"
   */
  @IsString({ message: 'Token metin olmalıdır' })
  @IsNotEmpty({ message: 'Token alanı zorunludur' })
  token: string;

  /**
   * Yeni şifre
   * En az 8 karakter, büyük/küçük harf ve rakam içermeli
   * @example "NewSecurePass123!"
   */
  @IsString({ message: 'Şifre metin olmalıdır' })
  @IsNotEmpty({ message: 'Şifre alanı zorunludur' })
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @MaxLength(64, { message: 'Şifre en fazla 64 karakter olabilir' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir',
  })
  password: string;
}
