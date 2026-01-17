import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto, AuthResponseDto } from './dto';

/**
 * API Response wrapper
 *
 * Standart response formatı (04-api-contracts.md)
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Auth Controller
 *
 * Kimlik doğrulama endpoint'lerini yönetir.
 * Base path: /auth
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   *
   * Kullanıcı girişi endpoint'i.
   *
   * Rate Limit: 5 istek / dakika (brute force koruması)
   *
   * Request Body:
   * - email: string (zorunlu)
   * - password: string (zorunlu, min 8 karakter)
   * - deviceId: string (opsiyonel, UUID)
   * - deviceName: string (opsiyonel)
   * - platform: 'ios' | 'android' | 'web' (opsiyonel)
   *
   * Response:
   * - user: Kullanıcı bilgileri
   * - accessToken: JWT access token (15 dk)
   * - refreshToken: Refresh token (7 gün)
   * - expiresIn: Access token süresi (saniye)
   *
   * Errors:
   * - 400: Validation error
   * - 401: Invalid credentials, account banned/suspended
   * - 429: Rate limited
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 istek / 1 dakika
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
  ): Promise<ApiResponse<AuthResponseDto>> {
    // Client IP'sini al (proxy arkasında olabilir)
    const ip = this.extractClientIp(request);
    const userAgent = request.headers['user-agent'] || '';

    this.logger.debug(`Login isteği: ${loginDto.email} - IP: ${ip}`);

    // Login işlemini gerçekleştir
    const result = await this.authService.login({
      ...loginDto,
      ip,
      userAgent,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Client IP Adresini Çıkar
   *
   * Cloud Run arkasında X-Forwarded-For header'ı kullanılır.
   * Birden fazla proxy varsa ilk IP alınır.
   *
   * Öncelik sırası:
   * 1. X-Forwarded-For header (proxy)
   * 2. X-Real-IP header (nginx)
   * 3. request.ip (Express)
   * 4. Socket remote address
   *
   * @param request - Express Request objesi
   * @returns Client IP adresi
   */
  private extractClientIp(request: Request): string {
    // X-Forwarded-For: client, proxy1, proxy2
    const forwarded = request.headers['x-forwarded-for'];

    if (typeof forwarded === 'string') {
      // İlk IP = gerçek client
      return forwarded.split(',')[0].trim();
    }

    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0].split(',')[0].trim();
    }

    // X-Real-IP (nginx)
    const realIp = request.headers['x-real-ip'];
    if (typeof realIp === 'string') {
      return realIp;
    }

    // Fallback
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }
}
