import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

/**
 * OAuth DTO
 *
 * Google ve Apple OAuth girişleri için
 *
 * Flow:
 * 1. Client, Google/Apple SDK ile idToken alır
 * 2. idToken bu endpoint'e gönderilir
 * 3. Server token'ı doğrular ve kullanıcı oluşturur/döner
 *
 * @example
 * {
 *   "idToken": "google_or_apple_id_token",
 *   "deviceId": "device_uuid_123",
 *   "deviceName": "iPhone 15 Pro",
 *   "platform": "ios"
 * }
 */
export class OAuthDto {
  /**
   * OAuth provider'dan alınan ID token
   * Google veya Apple SDK tarafından sağlanır
   * @example "eyJhbGciOiJSUzI1NiIs..."
   */
  @IsString({ message: 'ID token metin olmalıdır' })
  @IsNotEmpty({ message: 'ID token alanı zorunludur' })
  idToken: string;

  /**
   * Cihaz benzersiz kimliği (opsiyonel)
   * @example "device_uuid_123"
   */
  @IsString()
  @IsOptional()
  deviceId?: string;

  /**
   * Cihaz adı (opsiyonel)
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
