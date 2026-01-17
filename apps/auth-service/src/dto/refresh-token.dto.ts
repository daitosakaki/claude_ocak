import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Refresh Token DTO
 *
 * Token yenileme ve çıkış işlemleri için
 *
 * @example
 * {
 *   "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
 * }
 */
export class RefreshTokenDto {
  /**
   * Refresh token
   * Login sırasında alınan uzun ömürlü token
   * @example "dGhpcyBpcyBhIHJlZnJl..."
   */
  @IsString({ message: 'Refresh token metin olmalıdır' })
  @IsNotEmpty({ message: 'Refresh token alanı zorunludur' })
  refreshToken: string;
}
