import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { PubSub, Topic, PublishOptions as GcpPublishOptions } from '@google-cloud/pubsub';
import { v4 as uuidv4 } from 'uuid';
import { PUBSUB_CLIENT } from './pubsub.module';
import {
  BaseEvent,
  EventMetadata,
  PublishOptions,
  PubSubMessage,
} from './types';

/**
 * PublisherService
 * GCP Pub/Sub'a mesaj yayınlama servisi
 *
 * Kullanım:
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private publisher: PublisherService) {}
 *
 *   async createUser(data: CreateUserDto) {
 *     const user = await this.userRepo.create(data);
 *
 *     await this.publisher.publish('user-events', {
 *       eventType: 'user.created',
 *       payload: { userId: user.id, username: user.username },
 *     });
 *
 *     return user;
 *   }
 * }
 * ```
 */
@Injectable()
export class PublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(PublisherService.name);
  private readonly topicCache = new Map<string, Topic>();

  constructor(
    @Inject(PUBSUB_CLIENT)
    private readonly pubsub: PubSub,
  ) {}

  /**
   * Topic'e mesaj yayınla
   *
   * @param topicName - Topic adı (örn: 'user-events')
   * @param event - Yayınlanacak event
   * @param options - Yayınlama seçenekleri
   * @returns Message ID
   */
  async publish<T extends Partial<BaseEvent>>(
    topicName: string,
    event: T,
    options?: PublishOptions,
  ): Promise<string> {
    try {
      const topic = await this.getOrCreateTopic(topicName);

      // Event'i hazırla
      const fullEvent: BaseEvent = {
        eventId: uuidv4(),
        eventType: event.eventType || 'unknown',
        timestamp: new Date(),
        version: '1.0',
        source: process.env.SERVICE_NAME || 'unknown',
        ...event,
      };

      // Mesajı hazırla
      const message: PubSubMessage<BaseEvent> = {
        data: fullEvent,
        metadata: this.createMetadata(),
        publishedAt: new Date(),
      };

      // JSON'a çevir ve Buffer'a dönüştür
      const dataBuffer = Buffer.from(JSON.stringify(message));

      // Publish options
      const publishOptions: GcpPublishOptions = {};

      // Attributes ekle
      const attributes: Record<string, string> = {
        eventType: fullEvent.eventType,
        eventId: fullEvent.eventId,
        source: fullEvent.source,
        version: fullEvent.version,
        ...(options?.attributes || {}),
      };

      // Mesajı yayınla
      const messageId = await topic.publishMessage({
        data: dataBuffer,
        attributes,
        orderingKey: options?.orderingKey,
      });

      this.logger.debug(
        `Mesaj yayınlandı: ${topicName} - ${fullEvent.eventType} (${messageId})`,
      );

      return messageId;
    } catch (error) {
      this.logger.error(
        `Mesaj yayınlama hatası: ${topicName} - ${error}`,
      );
      throw error;
    }
  }

  /**
   * Batch mesaj yayınla
   *
   * @param topicName - Topic adı
   * @param events - Yayınlanacak event listesi
   * @returns Message ID listesi
   */
  async publishBatch<T extends Partial<BaseEvent>>(
    topicName: string,
    events: T[],
  ): Promise<string[]> {
    const messageIds: string[] = [];

    for (const event of events) {
      const messageId = await this.publish(topicName, event);
      messageIds.push(messageId);
    }

    return messageIds;
  }

  /**
   * Topic'i al veya oluştur
   */
  private async getOrCreateTopic(topicName: string): Promise<Topic> {
    // Cache'den kontrol et
    if (this.topicCache.has(topicName)) {
      return this.topicCache.get(topicName)!;
    }

    const topic = this.pubsub.topic(topicName);

    // Topic var mı kontrol et
    const [exists] = await topic.exists();

    if (!exists) {
      // Production'da topic yoksa hata fırlat, dev'de oluştur
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Topic bulunamadı: ${topicName}`);
      }

      this.logger.warn(`Topic oluşturuluyor: ${topicName}`);
      await this.pubsub.createTopic(topicName);
    }

    // Cache'e ekle
    this.topicCache.set(topicName, topic);

    return topic;
  }

  /**
   * Event metadata oluştur
   */
  private createMetadata(): EventMetadata {
    return {
      correlationId: uuidv4(),
      traceId: uuidv4(),
    };
  }

  /**
   * Module kapanırken topic'leri flush et
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Publisher kapatılıyor...');

    // Tüm topic'leri flush et
    for (const [name, topic] of this.topicCache) {
      try {
        await topic.flush();
        this.logger.debug(`Topic flushed: ${name}`);
      } catch (error) {
        this.logger.error(`Topic flush hatası: ${name} - ${error}`);
      }
    }

    this.topicCache.clear();
  }
}

// ==================== TOPIC-SPECIFIC PUBLISHERS ====================

/**
 * Type-safe publisher için helper fonksiyonlar
 */
export class TypedPublisher {
  constructor(private readonly publisher: PublisherService) {}

  /**
   * User event yayınla
   */
  async publishUserEvent(
    event: Partial<BaseEvent> & { eventType: string; payload: unknown },
  ): Promise<string> {
    return this.publisher.publish('user-events', event);
  }

  /**
   * Post event yayınla
   */
  async publishPostEvent(
    event: Partial<BaseEvent> & { eventType: string; payload: unknown },
  ): Promise<string> {
    return this.publisher.publish('post-events', event);
  }

  /**
   * Interaction event yayınla
   */
  async publishInteractionEvent(
    event: Partial<BaseEvent> & { eventType: string; payload: unknown },
  ): Promise<string> {
    return this.publisher.publish('interaction-events', event);
  }

  /**
   * Message event yayınla
   */
  async publishMessageEvent(
    event: Partial<BaseEvent> & { eventType: string; payload: unknown },
  ): Promise<string> {
    return this.publisher.publish('message-events', event);
  }

  /**
   * Media event yayınla
   */
  async publishMediaEvent(
    event: Partial<BaseEvent> & { eventType: string; payload: unknown },
  ): Promise<string> {
    return this.publisher.publish('media-events', event);
  }
}
