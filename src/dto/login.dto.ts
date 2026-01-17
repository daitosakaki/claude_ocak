import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * Login Request Validation Şeması
 *
 * Zod kullanarak type-safe validation.
 * API Contract'a uygun (04-api-contracts.md)
 */
export const LoginSchema = z.object({
  // Email - zorunlu, lowercase ve trim uygulanır
  email: z
    .string({
      required_error: 'Email adresi zorunludur',
      invalid_type_error: 'Email string olmalı',
    })
    .email('Geçerli bir email adresi giriniz')
    .toLowerCase()
    .trim(),

  // Şifre - minimum 8 karakter
  password: z
    .string({
      required_error: 'Şifre zorunludur',
    })
    .min(8, 'Şifre en az 8 karakter olmalı'),

  // Cihaz ID - UUID formatında, opsiyonel
  deviceId: z
    .string()
    .uuid('Geçersiz device ID formatı')
    .optional(),

  // Cihaz adı - örn: "iPhone 15 Pro", opsiyonel
  deviceName: z
    .string()
    .max(100, 'Cihaz adı en fazla 100 karakter olabilir')
    .optional(),

  // Platform - ios, android veya web
  platform: z
    .enum(['ios', 'android', 'web'], {
      errorMap: () => ({ message: 'Platform ios, android veya web olmalı' }),
    })
    .optional(),
});

// LoginSchema'dan TypeScript type çıkar
export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * NestJS DTO Sınıfı
 *
 * createZodDto ile Zod şemasından otomatik DTO oluşturur.
 * Swagger dekoratörleri otomatik eklenir.
 */
export class LoginDto extends createZodDto(LoginSchema) {}
