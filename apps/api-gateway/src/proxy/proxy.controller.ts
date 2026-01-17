import {
  Controller,
  All,
  Req,
  Res,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { matchRoute, RouteDefinition } from './routes';

/**
 * ProxyController
 * Tüm API request'lerini yakalar ve uygun servise yönlendirir
 *
 * Çalışma şekli:
 * 1. Request URL'ine göre route tanımını bul
 * 2. Route tanımına göre hedef servisi belirle
 * 3. ProxyService ile request'i downstream servise ilet
 * 4. Response'u client'a döndür
 */
@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Wildcard route handler
   * Tüm v1/* request'lerini yakalar
   */
  @All('v1/*')
  async handleRequest(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const url = req.originalUrl;
    const method = req.method;

    this.logger.debug(`Proxy request: ${method} ${url}`);

    try {
      // 1. Route tanımını bul
      const route = matchRoute(url, method);

      if (!route) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Route bulunamadı: ${method} ${url}`,
            },
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // 2. Servis aktif mi kontrol et
      if (!this.isServiceEnabled(route)) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'SERVICE_DISABLED',
              message: 'Bu özellik henüz aktif değil',
            },
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // 3. Path'i hazırla (prefix strip, rewrite vb.)
      const targetPath = this.preparePath(url, route);

      // 4. Request'i downstream servise yönlendir
      const response = await this.proxyService.forward(
        route.service,
        req,
        targetPath,
      );

      // 5. Response'u döndür
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Servis aktif mi kontrol et
   */
  private isServiceEnabled(route: RouteDefinition): boolean {
    // Listing ve Dating servisleri için özel kontrol
    if (route.service === 'listing') {
      return process.env.LISTING_SERVICE_ENABLED === 'true';
    }

    if (route.service === 'dating') {
      return process.env.DATING_SERVICE_ENABLED === 'true';
    }

    return true;
  }

  /**
   * Hedef path'i hazırla
   */
  private preparePath(url: string, route: RouteDefinition): string {
    let path = url;

    // Rewrite varsa uygula
    if (route.rewrite) {
      // Pattern'deki parametreleri değiştir
      path = route.rewrite;
    }

    // Prefix strip
    if (route.stripPrefix !== false) {
      // /v1 prefix'ini kaldır (varsayılan davranış)
      path = path.replace(/^\/v1/, '');
    }

    return path || '/';
  }

  /**
   * Hata işleme
   */
  private handleError(error: any, res: Response): void {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();

      res.status(status).json(response);
      return;
    }

    this.logger.error(`Proxy hatası: ${error.message}`, error.stack);

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Beklenmeyen bir hata oluştu',
      },
    });
  }
}
