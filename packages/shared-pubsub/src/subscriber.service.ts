import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PubSub, Subscription, Message } from '@google-cloud/pubsub';
import { PUBSUB_CLIENT } from './pubsub.module';
import {
  BaseEvent,
  EventHandler,
  EventMetadata,
  PubSubMessage,
  SubscribeOptions,
  SubscriptionHandler,
} from './types';

/**
 * SubscriberService
 * GCP Pub/Sub'dan mesaj dinleme servisi
 *
 * Kullanım:
 * ```typescript
 * @Injectable()
 * export class NotificationSubscriber implements OnModuleInit {
 *   constructor(private subscriber: SubscriberService) {}
 *
 *   async onModuleInit() {
 *     await this.subscriber.subscribe(
 *       'user-events',
 *       'notification-service-user-events',
 *       this.handleUserEvent.bind(this),
 *     );
 *   }
 *
 *   private async handleUserEvent(event: UserEvent, metadata: EventMetadata) {
 *     if (event.eventType === 'user.followed') {
 *       await this.sendFollowNotification(event.payload);
 *     }
 *   }
 * }
 * ```
 */
@Injectable()
export class SubscriberService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SubscriberService.name);
  private readonly subscriptions = new Map<string, Subscription>();
  private readonly handlers: SubscriptionHandler[] = [];

  constructor(
    @Inject(PUBSUB_CLIENT)
    private readonly pubsub: PubSub,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Subscriber servisi başlatılıyor...');
  }

  /**
   * Topic'e abone ol ve mesajları dinle
   *
   * @param topicName - Topic adı (örn: 'user-events')
   * @param subscriptionName - Subscription adı (örn: 'notification-service-user-events')
   * @param handler - Mesaj işleyici fonksiyon
   * @param options - Subscription seçenekleri
   */
  async subscribe<T extends BaseEvent = BaseEvent>(
    topicName: string,
    subscriptionName: string,
    handler: EventHandler<T>,
    options?: SubscribeOptions,
  ): Promise<void> {
    try {
      // Subscription'ı al veya oluştur
      const subscription = await this.getOrCreateSubscription(
        topicName,
        subscriptionName,
        options,
      );

      // Message handler
      const messageHandler = async (message: Message): Promise<void> => {
        const startTime = Date.now();

        try {
          // Mesajı parse et
          const parsedMessage = this.parseMessage<T>(message);

          if (!parsedMessage) {
            this.logger.warn(
              `Geçersiz mesaj formatı: ${subscriptionName} - ${message.id}`,
            );
            message.ack();
            return;
          }

          // Handler'ı çağır
          await handler(parsedMessage.data, parsedMessage.metadata);

          // Başarılı, mesajı onayla
          message.ack();

          const duration = Date.now() - startTime;
          this.logger.debug(
            `Mesaj işlendi: ${subscriptionName} - ${parsedMessage.data.eventType} (${duration}ms)`,
          );
        } catch (error) {
          // Hata durumunda mesajı reddet (retry için)
          message.nack();

          this.logger.error(
            `Mesaj işleme hatası: ${subscriptionName} - ${error}`,
          );
        }
      };

      // Error handler
      subscription.on('error', (error) => {
        this.logger.error(`Subscription hatası: ${subscriptionName} - ${error}`);
      });

      // Mesajları dinlemeye başla
      subscription.on('message', messageHandler);

      // Cache'e ekle
      this.subscriptions.set(subscriptionName, subscription);

      // Handler'ı kaydet
      this.handlers.push({
        topic: topicName,
        subscription: subscriptionName,
        handler: handler as EventHandler,
      });

      this.logger.log(
        `Subscription başlatıldı: ${topicName} -> ${subscriptionName}`,
      );
    } catch (error) {
      this.logger.error(
        `Subscription başlatma hatası: ${topicName} -> ${subscriptionName} - ${error}`,
      );
      throw error;
    }
  }

  /**
   * Belirli event tiplerini filtrele ve dinle
   *
   * @param topicName - Topic adı
   * @param subscriptionName - Subscription adı
   * @param eventTypes - Dinlenecek event tipleri
   * @param handler - Mesaj işleyici
   */
  async subscribeToEvents<T extends BaseEvent = BaseEvent>(
    topicName: string,
    subscriptionName: string,
    eventTypes: string[],
    handler: EventHandler<T>,
  ): Promise<void> {
    const filteredHandler: EventHandler<T> = async (event, metadata) => {
      if (eventTypes.includes(event.eventType)) {
        await handler(event, metadata);
      }
    };

    await this.subscribe(topicName, subscriptionName, filteredHandler);
  }

  /**
   * Subscription'ı al veya oluştur
   */
  private async getOrCreateSubscription(
    topicName: string,
    subscriptionName: string,
    options?: SubscribeOptions,
  ): Promise<Subscription> {
    const subscription = this.pubsub.subscription(subscriptionName);

    // Subscription var mı kontrol et
    const [exists] = await subscription.exists();

    if (!exists) {
      // Production'da subscription yoksa hata fırlat, dev'de oluştur
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Subscription bulunamadı: ${subscriptionName}`);
      }

      this.logger.warn(`Subscription oluşturuluyor: ${subscriptionName}`);

      // Önce topic'in var olduğundan emin ol
      const topic = this.pubsub.topic(topicName);
      const [topicExists] = await topic.exists();

      if (!topicExists) {
        await this.pubsub.createTopic(topicName);
      }

      // Subscription oluştur
      await topic.createSubscription(subscriptionName, {
        ackDeadlineSeconds: options?.ackDeadline || 30,
        messageRetentionDuration: { seconds: 604800 }, // 7 gün
        retryPolicy: {
          minimumBackoff: { seconds: 10 },
          maximumBackoff: { seconds: 600 },
        },
        deadLetterPolicy: {
          deadLetterTopic: `projects/${this.pubsub.projectId}/topics/${topicName}-dlq`,
          maxDeliveryAttempts: 5,
        },
      });
    }

    return subscription;
  }

  /**
   * Mesajı parse et
   */
  private parseMessage<T extends BaseEvent>(
    message: Message,
  ): PubSubMessage<T> | null {
    try {
      const data = JSON.parse(message.data.toString()) as PubSubMessage<T>;

      // Temel validasyon
      if (!data.data || !data.data.eventType) {
        return null;
      }

      return {
        ...data,
        messageId: message.id,
      };
    } catch {
      return null;
    }
  }

  /**
   * Subscription'ı durdur
   */
  async unsubscribe(subscriptionName: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionName);

    if (subscription) {
      subscription.removeAllListeners();
      await subscription.close();
      this.subscriptions.delete(subscriptionName);

      this.logger.log(`Subscription durduruldu: ${subscriptionName}`);
    }
  }

  /**
   * Module kapanırken tüm subscription'ları kapat
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Subscriber kapatılıyor...');

    for (const [name, subscription] of this.subscriptions) {
      try {
        subscription.removeAllListeners();
        await subscription.close();
        this.logger.debug(`Subscription kapatıldı: ${name}`);
      } catch (error) {
        this.logger.error(`Subscription kapatma hatası: ${name} - ${error}`);
      }
    }

    this.subscriptions.clear();
  }

  /**
   * Aktif subscription'ları listele
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Kayıtlı handler'ları listele
   */
  getRegisteredHandlers(): SubscriptionHandler[] {
    return [...this.handlers];
  }
}
