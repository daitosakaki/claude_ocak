/**
 * App Module - Media Service Ana Modülü
 *
 * Tüm modülleri bir araya getirir ve yapılandırır.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule } from '@superapp/shared-logger';
import { PubSubModule } from '@superapp/shared-pubsub';
import { MediaModule } from './media.module';
import { appConfig, storageConfig, uploadConfig } from './config';

@Module({
  imports: [
    // Konfigürasyon
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, storageConfig, uploadConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Logger
    LoggerModule.forRoot({
      serviceName: 'media-service',
    }),

    // Health Check
    TerminusModule,

    // Pub/Sub - Event publishing
    PubSubModule.forRoot({
      projectId: process.env.GCP_PROJECT_ID,
    }),

    // Media Module
    MediaModule,
  ],
})
export class AppModule {}
