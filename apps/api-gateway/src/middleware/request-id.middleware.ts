import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Request nesnesine userId eklemek için tip genişletme
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      userId?: string;
      deviceId?: string;
      platform?: string;
    }
  }
}

/**
 * RequestIdMiddleware
 * Her request'e benzersiz bir ID atar
 *
 * Faydaları:
 * - Request tracking
 * - Log correlation
 * - Debugging kolaylığı
 * - Distributed tracing
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Request ID: Header'dan al veya yeni oluştur
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Request'e ekle
    req.requestId = requestId;
    req.startTime = Date.now();

    // Device bilgilerini request'e ekle
    req.deviceId = req.headers['x-device-id'] as string;
    req.platform = req.headers['x-platform'] as string;

    // Response header'a ekle
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
