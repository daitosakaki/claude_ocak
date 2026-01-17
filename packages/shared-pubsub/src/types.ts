/**
 * Pub/Sub Types
 * Event ve message tipleri
 */

// ==================== BASE TYPES ====================

export interface PubSubConfig {
  projectId: string;
  keyFilename?: string;
  emulatorHost?: string;
}

export interface PublishOptions {
  orderingKey?: string;
  attributes?: Record<string, string>;
}

export interface SubscribeOptions {
  ackDeadline?: number;
  maxMessages?: number;
  maxExtension?: number;
}

// ==================== EVENT TYPES ====================

export interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: Date;
  version: string;
  source: string;
}

export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  traceId?: string;
}

export interface PubSubMessage<T = unknown> {
  data: T;
  metadata: EventMetadata;
  publishedAt: Date;
  messageId?: string;
}

// ==================== USER EVENTS ====================

export interface UserCreatedEvent extends BaseEvent {
  eventType: 'user.created';
  payload: {
    userId: string;
    username: string;
    email: string;
    displayName: string;
  };
}

export interface UserUpdatedEvent extends BaseEvent {
  eventType: 'user.updated';
  payload: {
    userId: string;
    changes: Record<string, unknown>;
  };
}

export interface UserFollowedEvent extends BaseEvent {
  eventType: 'user.followed';
  payload: {
    followerId: string;
    followingId: string;
    status: 'active' | 'pending';
  };
}

export interface UserUnfollowedEvent extends BaseEvent {
  eventType: 'user.unfollowed';
  payload: {
    followerId: string;
    followingId: string;
  };
}

export interface UserBlockedEvent extends BaseEvent {
  eventType: 'user.blocked';
  payload: {
    blockerId: string;
    blockedId: string;
  };
}

export type UserEvent =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserFollowedEvent
  | UserUnfollowedEvent
  | UserBlockedEvent;

// ==================== POST EVENTS ====================

export interface PostCreatedEvent extends BaseEvent {
  eventType: 'post.created';
  payload: {
    postId: string;
    authorId: string;
    type: 'text' | 'image' | 'video' | 'poll';
    visibility: 'public' | 'private' | 'followers';
    hashtags: string[];
    mentions: string[];
  };
}

export interface PostUpdatedEvent extends BaseEvent {
  eventType: 'post.updated';
  payload: {
    postId: string;
    authorId: string;
    changes: Record<string, unknown>;
  };
}

export interface PostDeletedEvent extends BaseEvent {
  eventType: 'post.deleted';
  payload: {
    postId: string;
    authorId: string;
  };
}

export type PostEvent = PostCreatedEvent | PostUpdatedEvent | PostDeletedEvent;

// ==================== INTERACTION EVENTS ====================

export interface PostLikedEvent extends BaseEvent {
  eventType: 'post.liked';
  payload: {
    postId: string;
    userId: string;
    authorId: string;
    likesCount: number;
  };
}

export interface PostUnlikedEvent extends BaseEvent {
  eventType: 'post.unliked';
  payload: {
    postId: string;
    userId: string;
    likesCount: number;
  };
}

export interface PostCommentedEvent extends BaseEvent {
  eventType: 'post.commented';
  payload: {
    postId: string;
    commentId: string;
    authorId: string;
    postAuthorId: string;
    parentId?: string;
    mentions: string[];
  };
}

export interface PostRepostedEvent extends BaseEvent {
  eventType: 'post.reposted';
  payload: {
    postId: string;
    repostId: string;
    userId: string;
    originalAuthorId: string;
    isQuote: boolean;
  };
}

export interface PollVotedEvent extends BaseEvent {
  eventType: 'poll.voted';
  payload: {
    postId: string;
    userId: string;
    optionId: string;
  };
}

export type InteractionEvent =
  | PostLikedEvent
  | PostUnlikedEvent
  | PostCommentedEvent
  | PostRepostedEvent
  | PollVotedEvent;

// ==================== MESSAGE EVENTS ====================

export interface MessageSentEvent extends BaseEvent {
  eventType: 'message.sent';
  payload: {
    messageId: string;
    conversationId: string;
    senderId: string;
    recipientIds: string[];
    type: 'text' | 'image' | 'video' | 'voice' | 'file';
    isOfflineRecipient: boolean;
  };
}

export interface ConversationCreatedEvent extends BaseEvent {
  eventType: 'conversation.created';
  payload: {
    conversationId: string;
    type: 'direct' | 'group' | 'listing' | 'dating';
    participantIds: string[];
    createdBy: string;
  };
}

export interface MatchCreatedEvent extends BaseEvent {
  eventType: 'match.created';
  payload: {
    matchId: string;
    conversationId: string;
    userIds: [string, string];
  };
}

export type MessageEvent =
  | MessageSentEvent
  | ConversationCreatedEvent
  | MatchCreatedEvent;

// ==================== NOTIFICATION EVENTS ====================

export interface NotificationEvent extends BaseEvent {
  eventType: 'notification.send';
  payload: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    channels: ('push' | 'email' | 'in_app')[];
  };
}

// ==================== MEDIA EVENTS ====================

export interface MediaProcessedEvent extends BaseEvent {
  eventType: 'media.processed';
  payload: {
    mediaId: string;
    userId: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    duration?: number;
    blurhash?: string;
  };
}

export interface MediaFailedEvent extends BaseEvent {
  eventType: 'media.failed';
  payload: {
    mediaId: string;
    userId: string;
    error: string;
  };
}

export type MediaEvent = MediaProcessedEvent | MediaFailedEvent;

// ==================== ALL EVENTS ====================

export type AllEvents =
  | UserEvent
  | PostEvent
  | InteractionEvent
  | MessageEvent
  | NotificationEvent
  | MediaEvent;

// ==================== HANDLER TYPES ====================

export type EventHandler<T extends BaseEvent = BaseEvent> = (
  event: T,
  metadata: EventMetadata,
) => Promise<void>;

export interface SubscriptionHandler {
  topic: string;
  subscription: string;
  handler: EventHandler;
}
