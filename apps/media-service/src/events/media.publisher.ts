/**
 * Media Publisher
 *
 * Medya işleme olaylarını Pub/Sub'a yayınlar.
 *
 * Events:
 * - media.processed: Medya başarıyla işlendi
 * - media.failed: Medya işleme başarısız oldu
 */

import { Injectable } from '@nestjs/common';
import { PublisherService } from '@superapp/shared-pubsub';
import { LoggerService } from '@superapp/shared-logger';

// Event tipleri
export interface MediaProcessedEvent {
  mediaId: string;
  userId: string;
  type: string;
  url: string;
  timestamp?: string;
}

export interface MediaFailedEvent {
  mediaId: string;
  userId: string;
  error: string;
  timestamp?: string;
}

@Injectable()
export class MediaPublisher {
  private readonly topicName = 'media-events';

  constructor(
    private readonly publisher: PublisherService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Medya işlendi event'i yayınla
   */
  async publishMediaProcessed(event: MediaProcessedEvent): Promise<void> {
    try {
      const message = {
        eventType: 'media.processed',
        timestamp: event.timestamp || new Date().toISOString(),
        data: {
          mediaId: event.mediaId,
          userId: event.userId,
          type: event.type,
          url: event.url,
        },
      };

      await this.publisher.publish(this.topicName, message);

      this.logger.log(
        `Event yayınlandı: media.processed (${event.mediaId})`,
        'MediaPublisher',
      );
    } catch (error) {
      this.logger.error(
        `Event yayınlama hatası: ${error.message}`,
        'MediaPublisher',
      );
      // Event publish hatası kritik değil, devam et
    }
  }

  /**
   * Medya işleme başarısız event'i yayınla
   */
  async publishMediaFailed(event: MediaFailedEvent): Promise<void> {
    try {
      const message = {
        eventType: 'media.failed',
        timestamp: event.timestamp || new Date().toISOString(),
        data: {
          mediaId: event.mediaId,
          userId: event.userId,
          error: event.error,
        },
      };

      await this.publisher.publish(this.topicName, message);

      this.logger.log(
        `Event yayınlandı: media.failed (${event.mediaId})`,
        'MediaPublisher',
      );
    } catch (error) {
      this.logger.error(
        `Event yayınlama hatası: ${error.message}`,
        'MediaPublisher',
      );
    }
  }

  /**
   * Medya silindi event'i yayınla
   */
  async publishMediaDeleted(mediaId: string, userId: string): Promise<void> {
    try {
      const message = {
        eventType: 'media.deleted',
        timestamp: new Date().toISOString(),
        data: {
          mediaId,
          userId,
        },
      };

      await this.publisher.publish(this.topicName, message);

      this.logger.log(
        `Event yayınlandı: media.deleted (${mediaId})`,
        'MediaPublisher',
      );
    } catch (error) {
      this.logger.error(
        `Event yayınlama hatası: ${error.message}`,
        'MediaPublisher',
      );
    }
  }
}
