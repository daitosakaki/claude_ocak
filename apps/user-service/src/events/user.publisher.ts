import { Injectable } from '@nestjs/common';
import { PublisherService } from '@superapp/shared-pubsub';
import { LoggerService } from '@superapp/shared-logger';
import {
  USER_EVENTS,
  USER_TOPIC,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserFollowedEvent,
  UserUnfollowedEvent,
  UserBlockedEvent,
  UserUnblockedEvent,
  UserStatusChangedEvent,
  UserVerifiedEvent,
} from './user.events';

@Injectable()
export class UserPublisher {
  constructor(
    private readonly publisher: PublisherService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Kullanıcı oluşturuldu eventi yayınla
   */
  async publishUserCreated(data: UserCreatedEvent): Promise<void> {
    await this.publish(USER_EVENTS.CREATED, data);
  }

  /**
   * Kullanıcı güncellendi eventi yayınla
   */
  async publishUserUpdated(data: UserUpdatedEvent): Promise<void> {
    await this.publish(USER_EVENTS.UPDATED, data);
  }

  /**
   * Kullanıcı takip etti eventi yayınla
   */
  async publishUserFollowed(data: UserFollowedEvent): Promise<void> {
    await this.publish(USER_EVENTS.FOLLOWED, data);
  }

  /**
   * Kullanıcı takibi bıraktı eventi yayınla
   */
  async publishUserUnfollowed(data: UserUnfollowedEvent): Promise<void> {
    await this.publish(USER_EVENTS.UNFOLLOWED, data);
  }

  /**
   * Kullanıcı engelledi eventi yayınla
   */
  async publishUserBlocked(data: UserBlockedEvent): Promise<void> {
    await this.publish(USER_EVENTS.BLOCKED, data);
  }

  /**
   * Kullanıcı engelini kaldırdı eventi yayınla
   */
  async publishUserUnblocked(data: UserUnblockedEvent): Promise<void> {
    await this.publish(USER_EVENTS.UNBLOCKED, data);
  }

  /**
   * Kullanıcı durumu değişti eventi yayınla
   */
  async publishUserStatusChanged(data: UserStatusChangedEvent): Promise<void> {
    await this.publish(USER_EVENTS.STATUS_CHANGED, data);
  }

  /**
   * Kullanıcı doğrulandı eventi yayınla
   */
  async publishUserVerified(data: UserVerifiedEvent): Promise<void> {
    await this.publish(USER_EVENTS.VERIFIED, data);
  }

  /**
   * Genel publish metodu
   */
  private async publish(eventType: string, data: unknown): Promise<void> {
    try {
      await this.publisher.publish(USER_TOPIC, {
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
        source: 'user-service',
      });

      this.logger.debug(`Event yayınlandı: ${eventType}`, 'UserPublisher');
    } catch (error) {
      this.logger.error(
        `Event yayınlama hatası: ${eventType}`,
        error instanceof Error ? error.stack : String(error),
        'UserPublisher',
      );
      // Event yayınlama hatası servis akışını durdurmamalı
    }
  }
}
