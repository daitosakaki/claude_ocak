import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * HealthModule
 * Sağlık kontrolü modülü
 *
 * Endpoints:
 * - /health - Genel sağlık durumu
 * - /health/live - Liveness probe (Kubernetes)
 * - /health/ready - Readiness probe (Kubernetes)
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
