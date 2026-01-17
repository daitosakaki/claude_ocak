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
 * Hata response yapısı
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
 * HTTP Exception Filter
 *
 * Tüm HTTP hatalarını yakalayıp standart formata dönüştürür
 *
 * Standart Hata Response:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human readable message",
 *     "details": { ... } // Opsiyonel
 *   }
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Zaten formatlı bir hata mı kontrol et
      if (this.isFormattedError(exceptionResponse)) {
        errorResponse = {
          success: false,
          error: exceptionResponse as ErrorResponse['error'],
        };
      } else if (typeof exceptionResponse === 'object') {
        // ValidationPipe hataları
        const resp = exceptionResponse as Record<string, unknown>;
        errorResponse = {
          success: false,
          error: {
            code: this.getErrorCode(status, resp),
            message: this.getMessage(resp),
            details: resp.message,
          },
        };
      } else {
        // String hata mesajı
        errorResponse = {
          success: false,
          error: {
            code: this.getErrorCodeFromStatus(status),
            message: exceptionResponse as string,
          },
        };
      }
    } else {
      // Beklenmeyen hatalar
      this.logger.error(
        `Unhandled exception: ${exception}`,
        exception instanceof Error ? exception.stack : undefined,
      );

      errorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      };
    }

    // Log
    this.logger.warn(
      `${request.method} ${request.url} - ${status} - ${errorResponse.error.code}`,
    );

    response.status(status).json(errorResponse);
  }

  /**
   * Zaten formatlı bir hata mı kontrol et
   */
  private isFormattedError(response: unknown): boolean {
    return (
      typeof response === 'object' &&
      response !== null &&
      'code' in response &&
      'message' in response
    );
  }

  /**
   * Hata kodunu belirle
   */
  private getErrorCode(
    status: number,
    response: Record<string, unknown>,
  ): string {
    if (response.code && typeof response.code === 'string') {
      return response.code;
    }

    return this.getErrorCodeFromStatus(status);
  }

  /**
   * HTTP status kodundan hata kodu oluştur
   */
  private getErrorCodeFromStatus(status: number): string {
    const statusCodes: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusCodes[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Hata mesajını al
   */
  private getMessage(response: Record<string, unknown>): string {
    if (typeof response.message === 'string') {
      return response.message;
    }

    if (Array.isArray(response.message) && response.message.length > 0) {
      return response.message[0];
    }

    return 'An error occurred';
  }
}
