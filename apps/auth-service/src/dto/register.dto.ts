import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * Register DTO
 *
 * Yeni kullanıcı kaydı için gerekli alanlar
 *
 * Şifre Kuralları:
 * - En az 8 karakter
 * - En az 1 büyük harf
 * - En az 1 küçük harf
 * - En az 1 rakam
 *
 * Username Kuralları:
 * - 3-20 karakter
 * - Sadece küçük harf, rakam ve alt çizgi
 * - Rakamla başlayamaz
 *
 * @example
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "username": "johndoe",
 *   "displayName": "John Doe"
 * }
 */
export class RegisterDto {
  /**
   * Email adresi
   * Benzersiz olmalı
   * @example "user@example.com"
   */
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  @IsNotEmpty({ message: 'Email alanı zorunludur' })
  email: string;

  /**
   * Şifre
   * En az 8 karakter, büyük/küçük harf ve rakam içermeli
   * @example "SecurePass123!"
   */
  @IsString({ message: 'Şifre metin olmalıdır' })
  @IsNotEmpty({ message: 'Şifre alanı zorunludur' })
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @MaxLength(64, { message: 'Şifre en fazla 64 karakter olabilir' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir',
  })
  password: string;

  /**
   * Kullanıcı adı
   * Benzersiz, 3-20 karakter, sadece küçük harf, rakam ve alt çizgi
   * @example "johndoe"
   */
  @IsString({ message: 'Kullanıcı adı metin olmalıdır' })
  @IsNotEmpty({ message: 'Kullanıcı adı alanı zorunludur' })
  @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter olmalıdır' })
  @MaxLength(20, { message: 'Kullanıcı adı en fazla 20 karakter olabilir' })
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'Kullanıcı adı küçük harfle başlamalı ve sadece küçük harf, rakam ve alt çizgi içerebilir',
  })
  username: string;

  /**
   * Görünen isim
   * Profilde gösterilecek isim
   * @example "John Doe"
   */
  @IsString({ message: 'Görünen isim metin olmalıdır' })
  @IsNotEmpty({ message: 'Görünen isim alanı zorunludur' })
  @MinLength(2, { message: 'Görünen isim en az 2 karakter olmalıdır' })
  @MaxLength(50, { message: 'Görünen isim en fazla 50 karakter olabilir' })
  displayName: string;
}
