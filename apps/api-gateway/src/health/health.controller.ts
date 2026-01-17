import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

/**
 * HealthController
 * Uygulama sağlık kontrolü endpoint'leri
 *
 * Kubernetes/Cloud Run tarafından kullanılır:
 * - Liveness: Uygulama çalışıyor mu?
 * - Readiness: Uygulama trafik almaya hazır mı?
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  /**
   * Genel sağlık kontrolü
   * GET /health
   *
   * Tüm bağımlılıkları kontrol eder
   */
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Memory kontrolü - Heap 500MB'dan az mı?
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),

      // RSS memory kontrolü - 1GB'dan az mı?
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),

      // Disk kontrolü - %90'dan az kullanılmış mı?
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),

      // Redis kontrolü (ileride eklenecek)
      // () => this.redis.checkConnection('redis'),

      // Downstream servis kontrolü (ileride eklenecek)
      // () => this.checkDownstreamServices(),
    ]);
  }

  /**
   * Liveness probe
   * GET /health/live
   *
   * Uygulama çalışıyor mu?
   * Basit bir kontrol - sadece response dönebiliyorsa sağlıklı
   */
  @Get('live')
  async live(): Promise<{ status: string }> {
    return { status: 'ok' };
  }

  /**
   * Readiness probe
   * GET /health/ready
   *
   * Uygulama trafik almaya hazır mı?
   * Kritik bağımlılıkları kontrol eder
   */
  @Get('ready')
  @HealthCheck()
  async ready(): Promise<HealthCheckResult> {
    return this.health.check([
      // Memory kontrolü
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),

      // Redis bağlantısı (ileride eklenecek)
      // () => this.checkRedis(),
    ]);
  }

  /**
   * Detaylı sağlık raporu
   * GET /health/details
   *
   * Debug için kullanılır
   */
  @Get('details')
  async details(): Promise<Record<string, any>> {
    const memoryUsage = process.memoryUsage();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'api-gateway',
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      memory: {
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
        external: this.formatBytes(memoryUsage.external),
        rss: this.formatBytes(memoryUsage.rss),
      },
      cpu: process.cpuUsage(),
    };
  }

  /**
   * Byte formatla
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Redis sağlık kontrolü (ileride eklenecek)
   */
  // private async checkRedis(): Promise<HealthIndicatorResult> {
  //   try {
  //     await this.redisService.ping();
  //     return {
  //       redis: {
  //         status: 'up',
  //       },
  //     };
  //   } catch (error) {
  //     return {
  //       redis: {
  //         status: 'down',
  //         message: error.message,
  //       },
  //     };
  //   }
  // }

  /**
   * Downstream servis kontrolü (ileride eklenecek)
   */
  // private async checkDownstreamServices(): Promise<HealthIndicatorResult> {
  //   const services = ['auth', 'user', 'post', 'feed'];
  //   const results: Record<string, any> = {};
  //
  //   for (const service of services) {
  //     const isHealthy = await this.proxyService.checkServiceHealth(service);
  //     results[service] = {
  //       status: isHealthy ? 'up' : 'down',
  //     };
  //   }
  //
  //   return {
  //     downstream_services: {
  //       status: Object.values(results).every((r) => r.status === 'up')
  //         ? 'up'
  //         : 'down',
  //       services: results,
  //     },
  //   };
  // }
}
