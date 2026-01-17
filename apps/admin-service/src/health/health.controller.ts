/**
 * Health Controller
 * Sağlık kontrolü endpoint'leri
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  /**
   * Basit sağlık kontrolü (load balancer için)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Basit sağlık kontrolü' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detaylı sağlık kontrolü
   */
  @Public()
  @Get('detailed')
  @HealthCheck()
  @ApiOperation({ summary: 'Detaylı sağlık kontrolü' })
  checkDetailed() {
    return this.health.check([
      // MongoDB bağlantısı
      () => this.mongoose.pingCheck('mongodb'),

      // Memory kullanımı (heap < 300MB)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // RSS memory (< 500MB)
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),

      // Disk kullanımı (< %90)
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  /**
   * Readiness probe (Kubernetes için)
   */
  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness kontrolü' })
  checkReady() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
    ]);
  }

  /**
   * Liveness probe (Kubernetes için)
   */
  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness kontrolü' })
  checkLive() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
