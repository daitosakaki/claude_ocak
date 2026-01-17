import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { Request } from 'express';

/**
 * Service bilgileri tipi
 */
interface ServiceConfig {
  name: string;
  url: string;
  timeout: number;
  enabled?: boolean;
}

/**
 * Circuit breaker durumu
 */
interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

/**
 * ProxyService
 * Downstream servislere request yönlendirme
 *
 * Özellikler:
 * - Automatic retry (exponential backoff)
 * - Circuit breaker
 * - Request timeout
 * - Header forwarding
 */
@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly httpClients = new Map<string, AxiosInstance>();
  private readonly circuitBreakers = new Map<string, CircuitState>();

  // Config
  private readonly retryMaxAttempts: number;
  private readonly retryInitialDelay: number;
  private readonly retryMaxDelay: number;
  private readonly cbFailureThreshold: number;
  private readonly cbResetTimeout: number;

  constructor(private readonly configService: ConfigService) {
    this.retryMaxAttempts = this.configService.get<number>(
      'app.retry.maxAttempts',
      2,
    );
    this.retryInitialDelay = this.configService.get<number>(
      'app.retry.initialDelay',
      100,
    );
    this.retryMaxDelay = this.configService.get<number>(
      'app.retry.maxDelay',
      1000,
    );
    this.cbFailureThreshold = this.configService.get<number>(
      'app.circuitBreaker.failureThreshold',
      5,
    );
    this.cbResetTimeout = this.configService.get<number>(
      'app.circuitBreaker.resetTimeout',
      30000,
    );

    // HTTP client'ları oluştur
    this.initializeClients();
  }

  /**
   * HTTP client'ları başlat
   */
  private initializeClients(): void {
    const services = [
      'auth',
      'user',
      'post',
      'feed',
      'interaction',
      'media',
      'message',
      'notification',
      'listing',
      'dating',
      'admin',
    ];

    for (const service of services) {
      const config = this.configService.get<ServiceConfig>(`services.${service}`);

      if (config) {
        const client = axios.create({
          baseURL: config.url,
          timeout: config.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        this.httpClients.set(service, client);

        // Circuit breaker başlat
        this.circuitBreakers.set(service, {
          failures: 0,
          lastFailure: 0,
          state: 'CLOSED',
        });

        this.logger.log(`HTTP client oluşturuldu: ${service} -> ${config.url}`);
      }
    }
  }

  /**
   * Request'i downstream servise yönlendir
   */
  async forward(
    serviceName: string,
    req: Request,
    path: string,
  ): Promise<any> {
    const client = this.httpClients.get(serviceName);

    if (!client) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: `Servis bulunamadı: ${serviceName}`,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Circuit breaker kontrolü
    this.checkCircuitBreaker(serviceName);

    // Request config hazırla
    const config: AxiosRequestConfig = {
      method: req.method as any,
      url: path,
      headers: this.forwardHeaders(req),
      params: req.query,
      data: req.body,
    };

    // Retry ile request gönder
    return this.executeWithRetry(serviceName, client, config);
  }

  /**
   * Retry mekanizması ile request gönder
   */
  private async executeWithRetry(
    serviceName: string,
    client: AxiosInstance,
    config: AxiosRequestConfig,
    attempt: number = 1,
  ): Promise<any> {
    try {
      const response = await client.request(config);

      // Başarılı - circuit breaker'ı reset et
      this.recordSuccess(serviceName);

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      // Retry yapılacak mı?
      const shouldRetry = this.shouldRetry(axiosError, attempt);

      if (shouldRetry) {
        const delay = this.calculateDelay(attempt);
        this.logger.warn(
          `Retry ${attempt}/${this.retryMaxAttempts} - ${serviceName} - ${delay}ms sonra`,
        );

        await this.sleep(delay);
        return this.executeWithRetry(serviceName, client, config, attempt + 1);
      }

      // Retry tükendi veya retry yapılmamalı
      this.recordFailure(serviceName);
      throw this.handleError(axiosError, serviceName);
    }
  }

  /**
   * Retry yapılmalı mı?
   */
  private shouldRetry(error: AxiosError, attempt: number): boolean {
    // Max attempt kontrolü
    if (attempt >= this.retryMaxAttempts) {
      return false;
    }

    // Response varsa, 5xx hatalarında retry yap
    if (error.response) {
      const status = error.response.status;
      return status >= 500 && status <= 599;
    }

    // Network hatası veya timeout
    if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
      return true;
    }

    return false;
  }

  /**
   * Exponential backoff delay hesapla
   */
  private calculateDelay(attempt: number): number {
    const delay = this.retryInitialDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, this.retryMaxDelay);
  }

  /**
   * Header'ları downstream servise forward et
   */
  private forwardHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-Id': req.requestId,
    };

    // User bilgileri (auth middleware tarafından eklenir)
    if (req.headers['x-user-id']) {
      headers['X-User-Id'] = req.headers['x-user-id'] as string;
    }
    if (req.headers['x-username']) {
      headers['X-Username'] = req.headers['x-username'] as string;
    }

    // Device bilgileri
    if (req.deviceId) {
      headers['X-Device-Id'] = req.deviceId;
    }
    if (req.platform) {
      headers['X-Platform'] = req.platform;
    }

    // Accept-Language
    if (req.headers['accept-language']) {
      headers['Accept-Language'] = req.headers['accept-language'] as string;
    }

    return headers;
  }

  /**
   * Circuit breaker kontrolü
   */
  private checkCircuitBreaker(serviceName: string): void {
    const state = this.circuitBreakers.get(serviceName);

    if (!state) return;

    switch (state.state) {
      case 'OPEN':
        // Reset timeout doldu mu?
        if (Date.now() - state.lastFailure >= this.cbResetTimeout) {
          state.state = 'HALF_OPEN';
          this.logger.log(`Circuit breaker HALF_OPEN: ${serviceName}`);
        } else {
          throw new HttpException(
            {
              success: false,
              error: {
                code: 'SERVICE_UNAVAILABLE',
                message: `Servis geçici olarak kullanılamıyor: ${serviceName}`,
              },
            },
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
        break;

      case 'HALF_OPEN':
        // İlk request'i dene
        break;

      case 'CLOSED':
        // Normal çalış
        break;
    }
  }

  /**
   * Başarılı request - circuit breaker reset
   */
  private recordSuccess(serviceName: string): void {
    const state = this.circuitBreakers.get(serviceName);

    if (state) {
      state.failures = 0;
      state.state = 'CLOSED';
    }
  }

  /**
   * Başarısız request - circuit breaker güncelle
   */
  private recordFailure(serviceName: string): void {
    const state = this.circuitBreakers.get(serviceName);

    if (state) {
      state.failures++;
      state.lastFailure = Date.now();

      if (state.failures >= this.cbFailureThreshold) {
        state.state = 'OPEN';
        this.logger.error(
          `Circuit breaker OPEN: ${serviceName} - ${state.failures} hata`,
        );
      }
    }
  }

  /**
   * Hata işleme
   */
  private handleError(error: AxiosError, serviceName: string): HttpException {
    // Downstream servis response döndü
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      // Downstream servisin hata formatını forward et
      if (data?.error) {
        return new HttpException(data, status);
      }

      return new HttpException(
        {
          success: false,
          error: {
            code: 'DOWNSTREAM_ERROR',
            message: `Servis hatası: ${serviceName}`,
          },
        },
        status,
      );
    }

    // Network hatası
    if (error.code === 'ECONNABORTED') {
      return new HttpException(
        {
          success: false,
          error: {
            code: 'SERVICE_TIMEOUT',
            message: `Servis yanıt vermedi: ${serviceName}`,
          },
        },
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }

    if (error.code === 'ECONNREFUSED') {
      return new HttpException(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: `Servise bağlanılamadı: ${serviceName}`,
          },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Diğer hatalar
    return new HttpException(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Beklenmeyen bir hata oluştu',
        },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Servis sağlık durumu
   */
  async checkServiceHealth(serviceName: string): Promise<boolean> {
    const client = this.httpClients.get(serviceName);
    const config = this.configService.get<ServiceConfig>(
      `services.${serviceName}`,
    );

    if (!client || !config) {
      return false;
    }

    try {
      await client.get(config.healthPath || '/health', { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}
