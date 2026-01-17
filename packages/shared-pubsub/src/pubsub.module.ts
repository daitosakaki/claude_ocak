import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { PubSub } from '@google-cloud/pubsub';
import { PublisherService } from './publisher.service';
import { SubscriberService } from './subscriber.service';
import { PubSubConfig } from './types';

// Injection tokens
export const PUBSUB_CLIENT = 'PUBSUB_CLIENT';
export const PUBSUB_CONFIG = 'PUBSUB_CONFIG';

/**
 * PubSubModule
 * GCP Pub/Sub entegrasyonu için NestJS modülü
 *
 * Kullanım:
 * ```typescript
 * // app.module.ts
 * @Module({
 *   imports: [
 *     PubSubModule.forRoot({
 *       projectId: 'superapp-prod',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * Async kullanım:
 * ```typescript
 * PubSubModule.forRootAsync({
 *   imports: [ConfigModule],
 *   useFactory: (config: ConfigService) => ({
 *     projectId: config.get('GCP_PROJECT_ID'),
 *   }),
 *   inject: [ConfigService],
 * })
 * ```
 */
@Global()
@Module({})
export class PubSubModule {
  /**
   * Senkron konfigürasyon ile modül oluşturma
   */
  static forRoot(config: PubSubConfig): DynamicModule {
    const pubsubClient = PubSubModule.createPubSubClient(config);

    const providers: Provider[] = [
      {
        provide: PUBSUB_CONFIG,
        useValue: config,
      },
      {
        provide: PUBSUB_CLIENT,
        useValue: pubsubClient,
      },
      PublisherService,
      SubscriberService,
    ];

    return {
      module: PubSubModule,
      providers,
      exports: [PublisherService, SubscriberService, PUBSUB_CLIENT],
    };
  }

  /**
   * Asenkron konfigürasyon ile modül oluşturma
   */
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<PubSubConfig> | PubSubConfig;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: PUBSUB_CONFIG,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      {
        provide: PUBSUB_CLIENT,
        useFactory: (config: PubSubConfig) => {
          return PubSubModule.createPubSubClient(config);
        },
        inject: [PUBSUB_CONFIG],
      },
      PublisherService,
      SubscriberService,
    ];

    return {
      module: PubSubModule,
      imports: options.imports || [],
      providers,
      exports: [PublisherService, SubscriberService, PUBSUB_CLIENT],
    };
  }

  /**
   * PubSub client oluşturma
   */
  private static createPubSubClient(config: PubSubConfig): PubSub {
    const options: any = {
      projectId: config.projectId,
    };

    // Key file varsa ekle
    if (config.keyFilename) {
      options.keyFilename = config.keyFilename;
    }

    // Emulator kullanılıyorsa
    if (config.emulatorHost) {
      process.env.PUBSUB_EMULATOR_HOST = config.emulatorHost;
    }

    return new PubSub(options);
  }
}
