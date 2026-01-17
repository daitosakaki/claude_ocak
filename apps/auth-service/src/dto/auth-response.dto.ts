/**
 * User Response DTO
 *
 * Kullanıcı bilgilerini döndürmek için
 */
export class UserResponseDto {
  /**
   * Kullanıcı ID
   * @example "user_123"
   */
  id: string;

  /**
   * Kullanıcı adı (benzersiz)
   * @example "johndoe"
   */
  username: string;

  /**
   * Görünen isim
   * @example "John Doe"
   */
  displayName: string;

  /**
   * Email adresi
   * @example "user@example.com"
   */
  email?: string;

  /**
   * Profil fotoğrafı URL'i
   * @example "https://cdn.../avatar.jpg"
   */
  avatar?: string;

  /**
   * Doğrulanmış hesap mı (mavi tik)
   * @example false
   */
  isVerified: boolean;

  /**
   * Hesap oluşturulma tarihi
   * @example "2024-01-15T10:00:00Z"
   */
  createdAt: Date;
}

/**
 * Auth Data DTO
 *
 * Kimlik doğrulama yanıtındaki data objesi
 */
export class AuthDataDto {
  /**
   * Kullanıcı bilgileri
   */
  user: UserResponseDto;

  /**
   * Access token (kısa ömürlü, 15 dk)
   * API isteklerinde Authorization header'da kullanılır
   * @example "eyJhbGciOiJSUzI1NiIs..."
   */
  accessToken: string;

  /**
   * Refresh token (uzun ömürlü, 7 gün)
   * Yeni access token almak için kullanılır
   * @example "dGhpcyBpcyBhIHJlZnJl..."
   */
  refreshToken: string;

  /**
   * Access token geçerlilik süresi (saniye)
   * @example 900
   */
  expiresIn: number;
}

/**
 * Auth Response DTO
 *
 * Tüm auth endpoint'lerinin standart yanıt formatı
 *
 * @example
 * {
 *   "success": true,
 *   "data": {
 *     "user": {
 *       "id": "user_123",
 *       "username": "johndoe",
 *       "displayName": "John Doe",
 *       "email": "user@example.com",
 *       "avatar": null,
 *       "isVerified": false,
 *       "createdAt": "2024-01-15T10:00:00Z"
 *     },
 *     "accessToken": "eyJhbGciOiJSUzI1NiIs...",
 *     "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
 *     "expiresIn": 900
 *   }
 * }
 */
export class AuthResponseDto {
  /**
   * İşlem başarılı mı
   * @example true
   */
  success: boolean;

  /**
   * Yanıt verisi
   */
  data: AuthDataDto;
}

/**
 * Token Only Response DTO
 *
 * Sadece token bilgilerini döndürmek için (refresh endpoint)
 */
export class TokenResponseDto {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
