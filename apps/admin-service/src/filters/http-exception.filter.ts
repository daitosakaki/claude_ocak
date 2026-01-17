/**
 * HTTP Exception Filter
 * Global hata yakalama ve formatlama
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Hata response interface
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
  requestId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'Bir hata oluştu';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        errorCode = responseObj.error || this.getErrorCode(status);
        details = responseObj.details;

        // class-validator hataları
        if (Array.isArray(responseObj.message)) {
          details = responseObj.message;
          message = 'Doğrulama hatası';
          errorCode = 'VALIDATION_ERROR';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(request.headers['x-request-id'] && {
        requestId: request.headers['x-request-id'] as string,
      }),
    };

    // Hata logla
    this.logError(request, status, errorCode, message, exception);

    response.status(status).json(errorResponse);
  }

  /**
   * HTTP status koduna göre error code döner
   */
  private getErrorCode(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
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

    return codeMap[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Hata logla
   */
  private logError(
    request: Request,
    status: number,
    code: string,
    message: string,
    exception: unknown,
  ): void {
    const logData = {
      method: request.method,
      url: request.url,
      status,
      code,
      message,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      adminId: (request as any).user?._id?.toString(),
    };

    if (status >= 500) {
      this.logger.error(logData, exception instanceof Error ? exception.stack : undefined);
    } else if (status >= 400) {
      this.logger.warn(logData);
    }
  }
}
