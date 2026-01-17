import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limit bilgileri için in-memory store
 * Production'da Redis kullanılmalı
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * RateLimitMiddleware
 * IP ve kullanıcı bazlı rate limiting
 *
 * Limitler:
 * - IP (unauthenticated): 60 req/min
 * - IP (authenticated): 120 req/min
 * - User: 300 req/min
 * - Endpoint özel: Değişken
 *
 * Response headers:
 * - X-Rate-Limit-Limit: Toplam limit
 * - X-Rate-Limit-Remaining: Kalan
 * - X-Rate-Limit-Reset: Reset zamanı (Unix timestamp)
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  // In-memory store (Production'da Redis kullanılmalı)
  private readonly store = new Map<string, RateLimitEntry>();

  // Config değerleri
  private readonly ipLimitUnauth: number;
  private readonly ipLimitAuth: number;
  private readonly userLimit: number;
  private readonly windowMs: number;
  private readonly endpointLimits: Record<string, { limit: number; windowMs: number }>;

  constructor(private readonly configService: ConfigService) {
    this.ipLimitUnauth = this.configService.get<number>(
      'app.rateLimit.ip.unauthenticated',
      60,
    );
    this.ipLimitAuth = this.configService.get<number>(
      'app.rateLimit.ip.authenticated',
      120,
    );
    this.userLimit = this.configService.get<number>(
      'app.rateLimit.user.limit',
      300,
    );
    this.windowMs = this.configService.get<number>(
      'app.rateLimit.ip.windowMs',
      60000,
    );
    this.endpointLimits =
      this.configService.get('app.rateLimit.endpoints') || {};

    // Cleanup timer: Eski entryleri temizle
    setInterval(() => this.cleanup(), 60000);
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const ip = this.getClientIp(req);
    const userId = req.userId;
    const endpoint = `${req.method}:${req.baseUrl}${req.path}`;

    try {
      // 1. Endpoint özel limiti kontrol et
      const endpointConfig = this.getEndpointConfig(endpoint);

      if (endpointConfig) {
        await this.checkLimit(
          `endpoint:${endpoint}:${ip}`,
          endpointConfig.limit,
          endpointConfig.windowMs,
          res,
        );
      }

      // 2. IP bazlı limit
      const ipLimit = userId ? this.ipLimitAuth : this.ipLimitUnauth;
      await this.checkLimit(`ip:${ip}`, ipLimit, this.windowMs, res);

      // 3. Kullanıcı bazlı limit (giriş yapmışsa)
      if (userId) {
        await this.checkLimit(
          `user:${userId}`,
          this.userLimit,
          this.windowMs,
          res,
        );
      }

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Rate limit hatası: ${error}`);
      next();
    }
  }

  /**
   * Limit kontrolü
   */
  private async checkLimit(
    key: string,
    limit: number,
    windowMs: number,
    res: Response,
  ): Promise<void> {
    const now = Date.now();
    let entry = this.store.get(key);

    // Entry yoksa veya süresi dolmuşsa yeni oluştur
    if (!entry || entry.resetAt <= now) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
      };
    }

    // Counter artır
    entry.count++;
    this.store.set(key, entry);

    // Response headers
    const remaining = Math.max(0, limit - entry.count);
    const resetAt = Math.ceil(entry.resetAt / 1000);

    res.setHeader('X-Rate-Limit-Limit', limit);
    res.setHeader('X-Rate-Limit-Remaining', remaining);
    res.setHeader('X-Rate-Limit-Reset', resetAt);

    // Limit aşıldı mı?
    if (entry.count > limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);

      throw new HttpException(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Çok fazla istek gönderildi. Lütfen bekleyin.',
            retryAfter,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Endpoint özel config'i al
   */
  private getEndpointConfig(
    endpoint: string,
  ): { limit: number; windowMs: number } | null {
    // Direkt eşleşme
    if (this.endpointLimits[endpoint]) {
      return this.endpointLimits[endpoint];
    }

    // Pattern eşleşme (basit)
    for (const [pattern, config] of Object.entries(this.endpointLimits)) {
      // :id gibi parametreleri wildcard olarak değerlendir
      const regex = new RegExp(
        '^' + pattern.replace(/:\w+/g, '[^/]+') + '$',
      );

      if (regex.test(endpoint)) {
        return config;
      }
    }

    return null;
  }

  /**
   * Client IP adresini al
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];

    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Eski entryleri temizle
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Rate limit cleanup: ${cleaned} entry silindi`);
    }
  }
}
