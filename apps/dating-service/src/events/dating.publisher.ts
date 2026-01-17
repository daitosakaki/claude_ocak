import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Dating Event Types
 */
export enum DatingEventType {
  PROFILE_CREATED = 'dating.profile.created',
  PROFILE_UPDATED = 'dating.profile.updated',
  PROFILE_DELETED = 'dating.profile.deleted',
  MATCH_CREATED = 'dating.match.created',
  MATCH_UNMATCHED = 'dating.match.unmatched',
  SWIPE_SUPERLIKE = 'dating.swipe.superlike',
  BOOST_ACTIVATED = 'dating.boost.activated',
}

/**
 * Base event interface
 */
interface BaseDatingEvent {
  type: DatingEventType;
  timestamp: string;
  payload: Record<string, any>;
}

/**
 * DatingPublisher
 * Dating modülü event'lerini Pub/Sub'a yayınlar
 * Notification service ve diğer servisler bu event'leri dinler
 */
@Injectable()
export class DatingPublisher {
  private readonly logger = new Logger(DatingPublisher.name);
  private readonly topicPrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.topicPrefix = this.configService.get<string>('pubsub.topicPrefix') || 'dating';
  }

  /**
   * Profil oluşturuldu event'i
   */
  async publishProfileCreated(userId: string): Promise<void> {
    await this.publish({
      type: DatingEventType.PROFILE_CREATED,
      timestamp: new Date().toISOString(),
      payload: { userId },
    });
  }

  /**
   * Profil güncellendi event'i
   */
  async publishProfileUpdated(userId: string): Promise<void> {
    await this.publish({
      type: DatingEventType.PROFILE_UPDATED,
      timestamp: new Date().toISOString(),
      payload: { userId },
    });
  }

  /**
   * Profil silindi event'i
   */
  async publishProfileDeleted(userId: string): Promise<void> {
    await this.publish({
      type: DatingEventType.PROFILE_DELETED,
      timestamp: new Date().toISOString(),
      payload: { userId },
    });
  }

  /**
   * Eşleşme oluştu event'i
   * Bu event notification service tarafından dinlenir
   * ve her iki kullanıcıya push notification gönderilir
   */
  async publishMatchCreated(
    matchId: string,
    userId1: string,
    userId2: string,
    wasSuperLike: boolean = false,
  ): Promise<void> {
    await this.publish({
      type: DatingEventType.MATCH_CREATED,
      timestamp: new Date().toISOString(),
      payload: {
        matchId,
        users: [userId1, userId2],
        wasSuperLike,
      },
    });

    this.logger.log(`Match event yayınlandı: ${matchId} (${userId1} <-> ${userId2})`);
  }

  /**
   * Eşleşme kaldırıldı event'i
   */
  async publishUnmatch(
    matchId: string,
    unmatchedBy: string,
    otherUserId: string,
  ): Promise<void> {
    await this.publish({
      type: DatingEventType.MATCH_UNMATCHED,
      timestamp: new Date().toISOString(),
      payload: {
        matchId,
        unmatchedBy,
        otherUserId,
      },
    });
  }

  /**
   * Super like alındı event'i
   * Premium kullanıcılar için notification
   */
  async publishSuperLikeReceived(
    targetUserId: string,
    fromUserId: string,
  ): Promise<void> {
    await this.publish({
      type: DatingEventType.SWIPE_SUPERLIKE,
      timestamp: new Date().toISOString(),
      payload: {
        targetUserId,
        fromUserId,
      },
    });

    this.logger.log(`Super like event yayınlandı: ${fromUserId} -> ${targetUserId}`);
  }

  /**
   * Boost aktifleştirildi event'i
   */
  async publishBoostActivated(
    userId: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.publish({
      type: DatingEventType.BOOST_ACTIVATED,
      timestamp: new Date().toISOString(),
      payload: {
        userId,
        expiresAt: expiresAt.toISOString(),
      },
    });
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Event'i Pub/Sub'a yayınlar
   * TODO: GCP Pub/Sub entegrasyonu yapılacak
   */
  private async publish(event: BaseDatingEvent): Promise<void> {
    try {
      // Geliştirme ortamında sadece loglama yap
      const isProduction =
        this.configService.get<string>('service.env') === 'production';

      if (!isProduction) {
        this.logger.debug(
          `[DEV] Event yayınlandı: ${event.type}`,
          JSON.stringify(event.payload),
        );
        return;
      }

      // Production'da GCP Pub/Sub kullan
      // const pubsub = new PubSub();
      // const topic = pubsub.topic(`${this.topicPrefix}-events`);
      // await topic.publishMessage({
      //   data: Buffer.from(JSON.stringify(event)),
      //   attributes: {
      //     type: event.type,
      //     timestamp: event.timestamp,
      //   },
      // });

      this.logger.debug(`Event yayınlandı: ${event.type}`);
    } catch (error) {
      this.logger.error(`Event yayınlama hatası: ${event.type}`, error);
      // Event yayınlama hatası kritik değil, işlemi durdurmayalım
    }
  }
}
