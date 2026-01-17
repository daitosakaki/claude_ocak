import { Injectable } from '@nestjs/common';
import { PublisherService } from '../publisher.service';
import {
  PostLikedEvent,
  PostUnlikedEvent,
  PostCommentedEvent,
  PostRepostedEvent,
  PollVotedEvent,
} from '../types';

/**
 * Interaction Topic Sabitleri
 */
export const INTERACTION_TOPIC = 'interaction-events';

export const INTERACTION_EVENT_TYPES = {
  LIKED: 'post.liked',
  UNLIKED: 'post.unliked',
  DISLIKED: 'post.disliked',
  UNDISLIKED: 'post.undisliked',
  COMMENTED: 'post.commented',
  COMMENT_DELETED: 'comment.deleted',
  COMMENT_LIKED: 'comment.liked',
  REPOSTED: 'post.reposted',
  UNREPOSTED: 'post.unreposted',
  BOOKMARKED: 'post.bookmarked',
  UNBOOKMARKED: 'post.unbookmarked',
  POLL_VOTED: 'poll.voted',
} as const;

/**
 * InteractionTopicPublisher
 * Interaction event'leri için type-safe publisher
 *
 * Kullanım:
 * ```typescript
 * @Injectable()
 * export class LikeService {
 *   constructor(private interactionPublisher: InteractionTopicPublisher) {}
 *
 *   async likePost(postId: string, userId: string) {
 *     const result = await this.repo.like(postId, userId);
 *
 *     await this.interactionPublisher.publishPostLiked({
 *       postId,
 *       userId,
 *       authorId: result.authorId,
 *       likesCount: result.likesCount,
 *     });
 *
 *     return result;
 *   }
 * }
 * ```
 */
@Injectable()
export class InteractionTopicPublisher {
  constructor(private readonly publisher: PublisherService) {}

  /**
   * post.liked event'i yayınla
   */
  async publishPostLiked(payload: {
    postId: string;
    userId: string;
    authorId: string;
    likesCount: number;
  }): Promise<string> {
    const event: Partial<PostLikedEvent> = {
      eventType: INTERACTION_EVENT_TYPES.LIKED,
      payload,
    };

    return this.publisher.publish(INTERACTION_TOPIC, event);
  }

  /**
   * post.unliked event'i yayınla
   */
  async publishPostUnliked(payload: {
    postId: string;
    userId: string;
    likesCount: number;
  }): Promise<string> {
    const event: Partial<PostUnlikedEvent> = {
      eventType: INTERACTION_EVENT_TYPES.UNLIKED,
      payload,
    };

    return this.publisher.publish(INTERACTION_TOPIC, event);
  }

  /**
   * post.disliked event'i yayınla
   */
  async publishPostDisliked(payload: {
    postId: string;
    userId: string;
    authorId: string;
    dislikesCount: number;
  }): Promise<string> {
    return this.publisher.publish(INTERACTION_TOPIC, {
      eventType: INTERACTION_EVENT_TYPES.DISLIKED,
      payload,
    });
  }

  /**
   * post.undisliked event'i yayınla
   */
  async publishPostUndisliked(payload: {
    postId: string;
    userId: string;
    dislikesCount: number;
  }): Promise<string> {
    return this.publisher.publish(INTERACTION_TOPIC, {
      eventType: INTERACTION_EVENT_TYPES.UNDISLIKED,
      payload,
    });
  }

  /**
   * post.commented event'i yayınla
   */
  async publishPostCommented(payload: {
    postId: string;
    commentId: string;
    authorId: string;
    postAuthorId: string;
    parentId?: string;
    mentions: string[];
  }): Promise<string> {
    const event: Partial<PostCommentedEvent> = {
      eventType: INTERACTION_EVENT_TYPES.COMMENTED,
      payload,
    };

    return this.publisher.publish(INTERACTION_TOPIC, event);
  }

  /**
   * comment.deleted event'i yayınla
   */
  async publishCommentDeleted(payload: {
    postId: string;
    commentId: string;
    authorId: string;
  }): Promise<string> {
    return this.publisher.publish(INTERACTION_TOPIC, {
      eventType: INTERACTION_EVENT_TYPES.COMMENT_DELETED,
      payload,
    });
  }

  /**
   * comment.liked event'i yayınla
   */
  async publishCommentLiked(payload: {
    commentId: string;
    postId: string;
    userId: string;
    commentAuthorId: string;
    likesCount: number;
  }): Promise<string> {
    return this.publisher.publish(INTERACTION_TOPIC, {
      eventType: INTERACTION_EVENT_TYPES.COMMENT_LIKED,
      payload,
    });
  }

  /**
   * post.reposted event'i yayınla
   */
  async publishPostReposted(payload: {
    postId: string;
    repostId: string;
    userId: string;
    originalAuthorId: string;
    isQuote: boolean;
  }): Promise<string> {
    const event: Partial<PostRepostedEvent> = {
      eventType: INTERACTION_EVENT_TYPES.REPOSTED,
      payload,
    };

    return this.publisher.publish(INTERACTION_TOPIC, event);
  }

  /**
   * post.unreposted event'i yayınla
   */
  async publishPostUnreposted(payload: {
    postId: string;
    userId: string;
  }): Promise<string> {
    return this.publisher.publish(INTERACTION_TOPIC, {
      eventType: INTERACTION_EVENT_TYPES.UNREPOSTED,
      payload,
    });
  }

  /**
   * post.bookmarked event'i yayınla
   */
  async publishPostBookmarked(payload: {
    postId: string;
    userId: string;
    folderId?: string;
  }): Promise<string> {
    return this.publisher.publish(INTERACTION_TOPIC, {
      eventType: INTERACTION_EVENT_TYPES.BOOKMARKED,
      payload,
    });
  }

  /**
   * post.unbookmarked event'i yayınla
   */
  async publishPostUnbookmarked(payload: {
    postId: string;
    userId: string;
  }): Promise<string> {
    return this.publisher.publish(INTERACTION_TOPIC, {
      eventType: INTERACTION_EVENT_TYPES.UNBOOKMARKED,
      payload,
    });
  }

  /**
   * poll.voted event'i yayınla
   */
  async publishPollVoted(payload: {
    postId: string;
    userId: string;
    optionId: string;
  }): Promise<string> {
    const event: Partial<PollVotedEvent> = {
      eventType: INTERACTION_EVENT_TYPES.POLL_VOTED,
      payload,
    };

    return this.publisher.publish(INTERACTION_TOPIC, event);
  }
}

/**
 * Interaction subscription naming convention
 * Format: {service-name}-interaction-events
 *
 * Örnekler:
 * - notification-service-interaction-events
 * - feed-service-interaction-events
 * - admin-service-interaction-events
 */
export const createInteractionSubscriptionName = (
  serviceName: string,
): string => {
  return `${serviceName}-interaction-events`;
};
