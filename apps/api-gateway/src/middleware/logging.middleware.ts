import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * LoggingMiddleware
 * Request/response logging
 *
 * Log formatı (JSON):
 * {
 *   timestamp: "2024-01-15T10:30:00Z",
 *   level: "info",
 *   service: "api-gateway",
 *   requestId: "uuid",
 *   method: "POST",
 *   path: "/v1/posts",
 *   statusCode: 201,
 *   duration: 45,
 *   userId: "user_123",
 *   ip: "1.2.3.4",
 *   userAgent: "SuperApp/1.0.0"
 * }
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'unknown';
    const appVersion = headers['x-app-version'] || 'unknown';

    // Response tamamlandığında logla
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - req.startTime;
      const contentLength = res.get('content-length') || 0;

      // Log entry
      const logEntry = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        method,
        path: originalUrl,
        statusCode,
        duration,
        contentLength,
        userId: req.userId || null,
        deviceId: req.deviceId || null,
        platform: req.platform || null,
        ip: this.getClientIp(req),
        userAgent,
        appVersion,
      };

      // Log level'a göre logla
      if (statusCode >= 500) {
        this.logger.error(JSON.stringify(logEntry));
      } else if (statusCode >= 400) {
        this.logger.warn(JSON.stringify(logEntry));
      } else {
        this.logger.log(JSON.stringify(logEntry));
      }
    });

    next();
  }

  /**
   * Client IP adresini al
   * Proxy arkasındaysa X-Forwarded-For header'ına bak
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];

    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
