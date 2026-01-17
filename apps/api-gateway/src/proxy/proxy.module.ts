import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProxyService } from './proxy.service';
import { ProxyController } from './proxy.controller';

/**
 * ProxyModule
 * Request yönlendirme modülü
 *
 * Gateway'den downstream servislere request'leri proxy eder.
 */
@Module({
  imports: [ConfigModule],
  providers: [ProxyService],
  controllers: [ProxyController],
  exports: [ProxyService],
})
export class ProxyModule {}
