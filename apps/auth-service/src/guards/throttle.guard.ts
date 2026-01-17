import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

/**
 * Throttle Guard
 *
 * Rate limiting için özelleştirilmiş guard
 *
 * Varsayılan limitler:
 * - Unauthenticated: 60 istek / dakika (IP bazlı)
 * - Authenticated: 120 istek / dakika (User + IP bazlı)
 *
 * Özel endpoint limitleri:
 * - POST /auth/login: 5 istek / dakika
 * - POST /auth/register: 3 istek / dakika
 * - POST /auth/forgot-password: 3 istek / dakika
 */
@Injectable()
export class ThrottleGuard extends ThrottlerGuard {
  /**
   * Rate limit key'ini belirle
   * Authenticated kullanıcılar için userId + IP
   * Unauthenticated için sadece IP
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = this.getClientIp(req);

    // Authenticated kullanıcı varsa userId ekle
    if (req.user?.userId) {
      return `${req.user.userId}:${ip}`;
    }

    return ip;
  }

  /**
   * Client IP adresini al
   * Proxy arkasında çalışırken X-Forwarded-For header'ını kontrol et
   */
  private getClientIp(req: Record<string, any>): string {
    // Cloud Run / Load Balancer arkasında
    const forwardedFor = req.headers?.['x-forwarded-for'];
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map((ip: string) => ip.trim());
      return ips[0];
    }

    // Cloud Run özel header
    const realIp = req.headers?.['x-real-ip'];
    if (realIp) {
      return realIp;
    }

    // Doğrudan bağlantı
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  /**
   * Rate limit aşıldığında özel hata mesajı
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const retryAfter = await this.getBlockDuration(context);

    throw new ThrottlerException(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
    );
  }

  /**
   * Belirli endpoint'ler için farklı limitler
   */
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.path;
    const method = request.method;

    // Health check endpoint'ini atla
    if (path === '/api/v1/auth/health') {
      return true;
    }

    return false;
  }

  /**
   * Blok süresini hesapla
   */
  private async getBlockDuration(context: ExecutionContext): Promise<number> {
    // TTL değerini al (milisaniye cinsinden)
    const ttlMs = await this.storageService.get(
      await this.getTracker(context.switchToHttp().getRequest()),
    );
    
    if (ttlMs && typeof ttlMs === 'object' && 'timeToExpire' in ttlMs) {
      return Math.ceil(ttlMs.timeToExpire / 1000);
    }
    
    return 60; // Varsayılan 60 saniye
  }
}
