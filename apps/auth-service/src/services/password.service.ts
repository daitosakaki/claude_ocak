import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * Password Service
 *
 * Şifre hash'leme ve doğrulama işlemleri
 *
 * Güvenlik:
 * - bcrypt algoritması (adaptive hash)
 * - Salt otomatik oluşturulur
 * - Cost factor: 12 (production için önerilen)
 *
 * Cost Factor Hakkında:
 * - Her artış hash süresini 2 katına çıkarır
 * - 10: ~10 hash/saniye
 * - 12: ~2.5 hash/saniye (önerilen)
 * - 14: ~0.6 hash/saniye (yüksek güvenlik)
 *
 * Daha yüksek değerler brute-force saldırılarını zorlaştırır
 * ancak sunucu yükünü de artırır.
 */
@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  /**
   * bcrypt cost factor (work factor)
   * 12 = 2^12 = 4096 iteration
   */
  private readonly SALT_ROUNDS = 12;

  /**
   * Şifreyi hash'le
   *
   * @param password - Düz metin şifre
   * @returns Hash'lenmiş şifre
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Şifre doğrulaması
   *
   * @param password - Düz metin şifre (kullanıcının girdiği)
   * @param hash - Hash'lenmiş şifre (veritabanından)
   * @returns Eşleşme durumu
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Şifre güçlülüğünü kontrol et
   *
   * Kurallar:
   * - En az 8 karakter
   * - En az 1 büyük harf
   * - En az 1 küçük harf
   * - En az 1 rakam
   * - Opsiyonel: En az 1 özel karakter
   *
   * @param password - Kontrol edilecek şifre
   * @returns Güçlülük seviyesi ve mesajlar
   */
  validateStrength(password: string): {
    isValid: boolean;
    score: number; // 0-4
    messages: string[];
  } {
    const messages: string[] = [];
    let score = 0;

    // Uzunluk kontrolü
    if (password.length < 8) {
      messages.push('Şifre en az 8 karakter olmalıdır');
    } else {
      score++;
      if (password.length >= 12) score++;
      if (password.length >= 16) score++;
    }

    // Büyük harf kontrolü
    if (!/[A-Z]/.test(password)) {
      messages.push('En az bir büyük harf içermelidir');
    } else {
      score += 0.5;
    }

    // Küçük harf kontrolü
    if (!/[a-z]/.test(password)) {
      messages.push('En az bir küçük harf içermelidir');
    } else {
      score += 0.5;
    }

    // Rakam kontrolü
    if (!/\d/.test(password)) {
      messages.push('En az bir rakam içermelidir');
    } else {
      score += 0.5;
    }

    // Özel karakter (bonus)
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 0.5;
    }

    // Skor normalizasyonu (0-4 arası)
    score = Math.min(Math.round(score), 4);

    return {
      isValid: messages.length === 0,
      score,
      messages,
    };
  }

  /**
   * Yaygın şifreleri kontrol et
   *
   * @param password - Kontrol edilecek şifre
   * @returns Yaygın şifre mi
   */
  isCommonPassword(password: string): boolean {
    // En yaygın 100 şifre listesi (kısaltılmış)
    const commonPasswords = [
      'password',
      '123456',
      '12345678',
      'qwerty',
      'abc123',
      'password1',
      'password123',
      '111111',
      '123123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
      'master',
      'login',
      'princess',
      'qwertyuiop',
      'solo',
      'passw0rd',
    ];

    return commonPasswords.includes(password.toLowerCase());
  }
}
