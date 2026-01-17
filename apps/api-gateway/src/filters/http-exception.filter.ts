import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Standart hata response formatı
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * HttpExceptionFilter
 * Global exception handler
 *
 * Tüm hataları standart formata çevirir:
 * {
 *   success: false,
 *   error: {
 *     code: "ERROR_CODE",
 *     message: "Human readable message",
 *     details: { ... }
 *   }
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // HTTP status kodu
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Hata bilgilerini çıkar
    const errorResponse = this.createErrorResponse(exception, status);

    // Logla
    this.logError(request, exception, status);

    // Response header'ları
    if (request.requestId) {
      response.setHeader('X-Request-Id', request.requestId);
    }

    // Response gönder
    response.status(status).json(errorResponse);
  }

  /**
   * Standart hata response'u oluştur
   */
  private createErrorResponse(
    exception: any,
    status: number,
  ): ErrorResponse {
    // HttpException ise
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      // Zaten doğru formatta ise
      if (
        typeof exceptionResponse === 'object' &&
        'error' in exceptionResponse
      ) {
        return exceptionResponse as ErrorResponse;
      }

      // NestJS validation hatası
      if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const response = exceptionResponse as any;

        // Validation error (class-validator)
        if (Array.isArray(response.message)) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Geçersiz veri',
              details: response.message.map((msg: any) => {
                if (typeof msg === 'string') {
                  return { message: msg };
                }
                return msg;
              }),
            },
          };
        }

        return {
          success: false,
          error: {
            code: this.getErrorCode(status, response.error),
            message: response.message,
          },
        };
      }

      // String response
      if (typeof exceptionResponse === 'string') {
        return {
          success: false,
          error: {
            code: this.getErrorCode(status),
            message: exceptionResponse,
          },
        };
      }
    }

    // Bilinmeyen hata
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Beklenmeyen bir hata oluştu'
            : exception.message || 'Beklenmeyen bir hata oluştu',
      },
    };
  }

  /**
   * HTTP status'a göre error code belirle
   */
  private getErrorCode(status: number, hint?: string): string {
    // Hint varsa kullan
    if (hint) {
      return hint.toUpperCase().replace(/\s+/g, '_');
    }

    // Status'a göre belirle
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      case 429:
        return 'RATE_LIMITED';
      case 500:
        return 'INTERNAL_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      case 504:
        return 'GATEWAY_TIMEOUT';
      default:
        return 'ERROR';
    }
  }

  /**
   * Hata loglama
   */
  private logError(
    request: Request,
    exception: any,
    status: number,
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode: status,
      userId: request.userId || null,
      error: {
        name: exception.name,
        message: exception.message,
        stack:
          process.env.NODE_ENV !== 'production' ? exception.stack : undefined,
      },
    };

    if (status >= 500) {
      this.logger.error(JSON.stringify(logEntry));
    } else if (status >= 400) {
      this.logger.warn(JSON.stringify(logEntry));
    }
  }
}
