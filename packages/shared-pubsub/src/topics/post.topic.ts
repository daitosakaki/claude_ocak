import { Injectable } from '@nestjs/common';
import { PublisherService } from '../publisher.service';
import {
  PostCreatedEvent,
  PostUpdatedEvent,
  PostDeletedEvent,
} from '../types';

/**
 * Post Topic Sabitleri
 */
export const POST_TOPIC = 'post-events';

export const POST_EVENT_TYPES = {
  CREATED: 'post.created',
  UPDATED: 'post.updated',
  DELETED: 'post.deleted',
  HIDDEN: 'post.hidden',
  PINNED: 'post.pinned',
  UNPINNED: 'post.unpinned',
} as const;

/**
 * PostTopicPublisher
 * Post event'leri için type-safe publisher
 *
 * Kullanım:
 * ```typescript
 * @Injectable()
 * export class PostService {
 *   constructor(private postPublisher: PostTopicPublisher) {}
 *
 *   async createPost(data: CreatePostDto, userId: string) {
 *     const post = await this.repo.create({ ...data, authorId: userId });
 *
 *     await this.postPublisher.publishPostCreated({
 *       postId: post.id,
 *       authorId: userId,
 *       type: post.type,
 *       visibility: post.visibility,
 *       hashtags: post.hashtags,
 *       mentions: post.mentions,
 *     });
 *
 *     return post;
 *   }
 * }
 * ```
 */
@Injectable()
export class PostTopicPublisher {
  constructor(private readonly publisher: PublisherService) {}

  /**
   * post.created event'i yayınla
   */
  async publishPostCreated(payload: {
    postId: string;
    authorId: string;
    type: 'text' | 'image' | 'video' | 'poll';
    visibility: 'public' | 'private' | 'followers';
    hashtags: string[];
    mentions: string[];
    isRepost?: boolean;
    originalPostId?: string;
    isQuote?: boolean;
  }): Promise<string> {
    const event: Partial<PostCreatedEvent> = {
      eventType: POST_EVENT_TYPES.CREATED,
      payload: {
        postId: payload.postId,
        authorId: payload.authorId,
        type: payload.type,
        visibility: payload.visibility,
        hashtags: payload.hashtags,
        mentions: payload.mentions,
      },
    };

    return this.publisher.publish(POST_TOPIC, event);
  }

  /**
   * post.updated event'i yayınla
   */
  async publishPostUpdated(payload: {
    postId: string;
    authorId: string;
    changes: Record<string, unknown>;
  }): Promise<string> {
    const event: Partial<PostUpdatedEvent> = {
      eventType: POST_EVENT_TYPES.UPDATED,
      payload,
    };

    return this.publisher.publish(POST_TOPIC, event);
  }

  /**
   * post.deleted event'i yayınla
   */
  async publishPostDeleted(payload: {
    postId: string;
    authorId: string;
  }): Promise<string> {
    const event: Partial<PostDeletedEvent> = {
      eventType: POST_EVENT_TYPES.DELETED,
      payload,
    };

    return this.publisher.publish(POST_TOPIC, event);
  }

  /**
   * post.hidden event'i yayınla (moderasyon)
   */
  async publishPostHidden(payload: {
    postId: string;
    authorId: string;
    reason: string;
    hiddenBy: string;
  }): Promise<string> {
    return this.publisher.publish(POST_TOPIC, {
      eventType: POST_EVENT_TYPES.HIDDEN,
      payload,
    });
  }

  /**
   * post.pinned event'i yayınla
   */
  async publishPostPinned(payload: {
    postId: string;
    authorId: string;
  }): Promise<string> {
    return this.publisher.publish(POST_TOPIC, {
      eventType: POST_EVENT_TYPES.PINNED,
      payload,
    });
  }

  /**
   * post.unpinned event'i yayınla
   */
  async publishPostUnpinned(payload: {
    postId: string;
    authorId: string;
  }): Promise<string> {
    return this.publisher.publish(POST_TOPIC, {
      eventType: POST_EVENT_TYPES.UNPINNED,
      payload,
    });
  }
}

/**
 * Post subscription naming convention
 * Format: {service-name}-post-events
 *
 * Örnekler:
 * - feed-service-post-events
 * - notification-service-post-events
 * - admin-service-post-events
 */
export const createPostSubscriptionName = (serviceName: string): string => {
  return `${serviceName}-post-events`;
};
