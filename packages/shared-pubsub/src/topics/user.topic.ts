import { Injectable } from '@nestjs/common';
import { PublisherService } from '../publisher.service';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserFollowedEvent,
  UserUnfollowedEvent,
  UserBlockedEvent,
} from '../types';

/**
 * User Topic Sabitleri
 */
export const USER_TOPIC = 'user-events';

export const USER_EVENT_TYPES = {
  CREATED: 'user.created',
  UPDATED: 'user.updated',
  FOLLOWED: 'user.followed',
  UNFOLLOWED: 'user.unfollowed',
  BLOCKED: 'user.blocked',
  UNBLOCKED: 'user.unblocked',
  VERIFIED: 'user.verified',
  DELETED: 'user.deleted',
} as const;

/**
 * UserTopicPublisher
 * User event'leri için type-safe publisher
 *
 * Kullanım:
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private userPublisher: UserTopicPublisher) {}
 *
 *   async createUser(data: CreateUserDto) {
 *     const user = await this.repo.create(data);
 *
 *     await this.userPublisher.publishUserCreated({
 *       userId: user.id,
 *       username: user.username,
 *       email: user.email,
 *       displayName: user.displayName,
 *     });
 *
 *     return user;
 *   }
 * }
 * ```
 */
@Injectable()
export class UserTopicPublisher {
  constructor(private readonly publisher: PublisherService) {}

  /**
   * user.created event'i yayınla
   */
  async publishUserCreated(payload: {
    userId: string;
    username: string;
    email: string;
    displayName: string;
  }): Promise<string> {
    const event: Partial<UserCreatedEvent> = {
      eventType: USER_EVENT_TYPES.CREATED,
      payload,
    };

    return this.publisher.publish(USER_TOPIC, event);
  }

  /**
   * user.updated event'i yayınla
   */
  async publishUserUpdated(payload: {
    userId: string;
    changes: Record<string, unknown>;
  }): Promise<string> {
    const event: Partial<UserUpdatedEvent> = {
      eventType: USER_EVENT_TYPES.UPDATED,
      payload,
    };

    return this.publisher.publish(USER_TOPIC, event);
  }

  /**
   * user.followed event'i yayınla
   */
  async publishUserFollowed(payload: {
    followerId: string;
    followingId: string;
    status: 'active' | 'pending';
  }): Promise<string> {
    const event: Partial<UserFollowedEvent> = {
      eventType: USER_EVENT_TYPES.FOLLOWED,
      payload,
    };

    return this.publisher.publish(USER_TOPIC, event);
  }

  /**
   * user.unfollowed event'i yayınla
   */
  async publishUserUnfollowed(payload: {
    followerId: string;
    followingId: string;
  }): Promise<string> {
    const event: Partial<UserUnfollowedEvent> = {
      eventType: USER_EVENT_TYPES.UNFOLLOWED,
      payload,
    };

    return this.publisher.publish(USER_TOPIC, event);
  }

  /**
   * user.blocked event'i yayınla
   */
  async publishUserBlocked(payload: {
    blockerId: string;
    blockedId: string;
  }): Promise<string> {
    const event: Partial<UserBlockedEvent> = {
      eventType: USER_EVENT_TYPES.BLOCKED,
      payload,
    };

    return this.publisher.publish(USER_TOPIC, event);
  }

  /**
   * user.unblocked event'i yayınla
   */
  async publishUserUnblocked(payload: {
    blockerId: string;
    blockedId: string;
  }): Promise<string> {
    return this.publisher.publish(USER_TOPIC, {
      eventType: USER_EVENT_TYPES.UNBLOCKED,
      payload,
    });
  }

  /**
   * user.verified event'i yayınla
   */
  async publishUserVerified(payload: {
    userId: string;
    verificationType: 'email' | 'phone' | 'identity';
  }): Promise<string> {
    return this.publisher.publish(USER_TOPIC, {
      eventType: USER_EVENT_TYPES.VERIFIED,
      payload,
    });
  }

  /**
   * user.deleted event'i yayınla
   */
  async publishUserDeleted(payload: { userId: string }): Promise<string> {
    return this.publisher.publish(USER_TOPIC, {
      eventType: USER_EVENT_TYPES.DELETED,
      payload,
    });
  }
}

/**
 * User subscription naming convention
 * Format: {service-name}-user-events
 *
 * Örnekler:
 * - notification-service-user-events
 * - feed-service-user-events
 * - admin-service-user-events
 */
export const createUserSubscriptionName = (serviceName: string): string => {
  return `${serviceName}-user-events`;
};
