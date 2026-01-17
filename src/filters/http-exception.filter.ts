import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ZodError } from 'zod';

/**
 * API Error Response yapısı
 *
 * 04-api-contracts.md'ye uygun format
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Global Exception Filter
 *
 * Tüm hataları yakalayıp standart formatta döner.
 *
 * Yakalanan hata türleri:
 * - HttpException (NestJS)
 * - ZodError (Validation)
 * - Error (Genel)
 * - Unknown
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Beklenmeyen bir hata oluştu';
    let details: unknown = undefined;

    // ==================== HttpException ====================
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        code = (resp.code as string) || this.getCodeFromStatus(status);
        message = (resp.message as string) || exception.message;
        details = resp.details;
      } else {
        message = exceptionResponse as string;
        code = this.getCodeFromStatus(status);
      }
    }
    // ==================== Zod Validation Error ====================
    else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      message = 'Geçersiz veri formatı';
      details = exception.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
    }
    // ==================== Genel Error ====================
    else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }
    // ==================== Unknown ====================
    else {
      this.logger.error('Unknown error:', exception);
    }

    // Loglama (production'da kritik hatalar için)
    if (status >= 500) {
      this.logger.error({
        message: `${request.method} ${request.url} - ${status}`,
        code,
        error: message,
        stack: exception instanceof Error ? exception.stack : undefined,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
    } else if (status >= 400) {
      this.logger.warn({
        message: `${request.method} ${request.url} - ${status}`,
        code,
        error: message,
      });
    }

    // Response gönder
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    };

    response.status(status).json(errorResponse);
  }

  /**
   * HTTP status kodundan error code üret
   */
  private getCodeFromStatus(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return statusMap[status] || 'UNKNOWN_ERROR';
  }
}
