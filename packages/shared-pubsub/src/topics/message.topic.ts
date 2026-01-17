import { Injectable } from '@nestjs/common';
import { PublisherService } from '../publisher.service';
import {
  MessageSentEvent,
  ConversationCreatedEvent,
  MatchCreatedEvent,
} from '../types';

/**
 * Message Topic Sabitleri
 */
export const MESSAGE_TOPIC = 'message-events';

export const MESSAGE_EVENT_TYPES = {
  SENT: 'message.sent',
  DELIVERED: 'message.delivered',
  READ: 'message.read',
  DELETED: 'message.deleted',
  CONVERSATION_CREATED: 'conversation.created',
  CONVERSATION_UPDATED: 'conversation.updated',
  CONVERSATION_DELETED: 'conversation.deleted',
  MATCH_CREATED: 'match.created',
  MATCH_DELETED: 'match.deleted',
} as const;

/**
 * MessageTopicPublisher
 * Message event'leri için type-safe publisher
 *
 * Kullanım:
 * ```typescript
 * @Injectable()
 * export class MessageService {
 *   constructor(private messagePublisher: MessageTopicPublisher) {}
 *
 *   async sendMessage(data: SendMessageDto, senderId: string) {
 *     const message = await this.repo.create({ ...data, senderId });
 *
 *     // Offline kullanıcılar için push notification tetikle
 *     const offlineRecipients = await this.checkOnlineStatus(data.recipientIds);
 *
 *     if (offlineRecipients.length > 0) {
 *       await this.messagePublisher.publishMessageSent({
 *         messageId: message.id,
 *         conversationId: data.conversationId,
 *         senderId,
 *         recipientIds: offlineRecipients,
 *         type: message.type,
 *         isOfflineRecipient: true,
 *       });
 *     }
 *
 *     return message;
 *   }
 * }
 * ```
 */
@Injectable()
export class MessageTopicPublisher {
  constructor(private readonly publisher: PublisherService) {}

  /**
   * message.sent event'i yayınla
   * Not: Bu event sadece offline kullanıcılar için push notification tetiklemek için kullanılır.
   * Online kullanıcılara mesajlar WebSocket üzerinden iletilir.
   */
  async publishMessageSent(payload: {
    messageId: string;
    conversationId: string;
    senderId: string;
    recipientIds: string[];
    type: 'text' | 'image' | 'video' | 'voice' | 'file';
    isOfflineRecipient: boolean;
    preview?: string;
  }): Promise<string> {
    const event: Partial<MessageSentEvent> = {
      eventType: MESSAGE_EVENT_TYPES.SENT,
      payload: {
        messageId: payload.messageId,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        recipientIds: payload.recipientIds,
        type: payload.type,
        isOfflineRecipient: payload.isOfflineRecipient,
      },
    };

    return this.publisher.publish(MESSAGE_TOPIC, event);
  }

  /**
   * message.delivered event'i yayınla
   */
  async publishMessageDelivered(payload: {
    messageId: string;
    conversationId: string;
    deliveredTo: string;
    deliveredAt: Date;
  }): Promise<string> {
    return this.publisher.publish(MESSAGE_TOPIC, {
      eventType: MESSAGE_EVENT_TYPES.DELIVERED,
      payload,
    });
  }

  /**
   * message.read event'i yayınla
   */
  async publishMessageRead(payload: {
    conversationId: string;
    messageId: string;
    readBy: string;
    readAt: Date;
  }): Promise<string> {
    return this.publisher.publish(MESSAGE_TOPIC, {
      eventType: MESSAGE_EVENT_TYPES.READ,
      payload,
    });
  }

  /**
   * message.deleted event'i yayınla
   */
  async publishMessageDeleted(payload: {
    messageId: string;
    conversationId: string;
    deletedBy: string;
    deleteForEveryone: boolean;
  }): Promise<string> {
    return this.publisher.publish(MESSAGE_TOPIC, {
      eventType: MESSAGE_EVENT_TYPES.DELETED,
      payload,
    });
  }

  /**
   * conversation.created event'i yayınla
   */
  async publishConversationCreated(payload: {
    conversationId: string;
    type: 'direct' | 'group' | 'listing' | 'dating';
    participantIds: string[];
    createdBy: string;
    name?: string;
  }): Promise<string> {
    const event: Partial<ConversationCreatedEvent> = {
      eventType: MESSAGE_EVENT_TYPES.CONVERSATION_CREATED,
      payload: {
        conversationId: payload.conversationId,
        type: payload.type,
        participantIds: payload.participantIds,
        createdBy: payload.createdBy,
      },
    };

    return this.publisher.publish(MESSAGE_TOPIC, event);
  }

  /**
   * conversation.updated event'i yayınla
   */
  async publishConversationUpdated(payload: {
    conversationId: string;
    changes: Record<string, unknown>;
    updatedBy: string;
  }): Promise<string> {
    return this.publisher.publish(MESSAGE_TOPIC, {
      eventType: MESSAGE_EVENT_TYPES.CONVERSATION_UPDATED,
      payload,
    });
  }

  /**
   * conversation.deleted event'i yayınla
   */
  async publishConversationDeleted(payload: {
    conversationId: string;
    deletedBy: string;
  }): Promise<string> {
    return this.publisher.publish(MESSAGE_TOPIC, {
      eventType: MESSAGE_EVENT_TYPES.CONVERSATION_DELETED,
      payload,
    });
  }

  /**
   * match.created event'i yayınla
   * Flört modülünden eşleşme olduğunda tetiklenir
   */
  async publishMatchCreated(payload: {
    matchId: string;
    conversationId: string;
    userIds: [string, string];
  }): Promise<string> {
    const event: Partial<MatchCreatedEvent> = {
      eventType: MESSAGE_EVENT_TYPES.MATCH_CREATED,
      payload,
    };

    return this.publisher.publish(MESSAGE_TOPIC, event);
  }

  /**
   * match.deleted event'i yayınla (unmatch)
   */
  async publishMatchDeleted(payload: {
    matchId: string;
    conversationId: string;
    deletedBy: string;
  }): Promise<string> {
    return this.publisher.publish(MESSAGE_TOPIC, {
      eventType: MESSAGE_EVENT_TYPES.MATCH_DELETED,
      payload,
    });
  }
}

/**
 * Message subscription naming convention
 * Format: {service-name}-message-events
 *
 * Örnekler:
 * - notification-service-message-events
 */
export const createMessageSubscriptionName = (serviceName: string): string => {
  return `${serviceName}-message-events`;
};

/**
 * Dating Topic Sabitleri (message topic altında)
 */
export const DATING_TOPIC = 'dating-events';

export const DATING_EVENT_TYPES = {
  PROFILE_CREATED: 'dating.profile.created',
  PROFILE_UPDATED: 'dating.profile.updated',
  SWIPE_LIKE: 'dating.swipe.like',
  SWIPE_SUPERLIKE: 'dating.swipe.superlike',
  SWIPE_PASS: 'dating.swipe.pass',
  MATCH_CREATED: 'dating.match.created',
  MATCH_UNMATCHED: 'dating.match.unmatched',
  BOOST_ACTIVATED: 'dating.boost.activated',
} as const;

/**
 * DatingTopicPublisher
 * Dating event'leri için type-safe publisher
 */
@Injectable()
export class DatingTopicPublisher {
  constructor(private readonly publisher: PublisherService) {}

  /**
   * dating.swipe.superlike event'i yayınla
   */
  async publishSuperLike(payload: {
    swiperId: string;
    targetId: string;
  }): Promise<string> {
    return this.publisher.publish(DATING_TOPIC, {
      eventType: DATING_EVENT_TYPES.SWIPE_SUPERLIKE,
      payload,
    });
  }

  /**
   * dating.match.created event'i yayınla
   */
  async publishMatchCreated(payload: {
    matchId: string;
    userIds: [string, string];
    conversationId: string;
  }): Promise<string> {
    return this.publisher.publish(DATING_TOPIC, {
      eventType: DATING_EVENT_TYPES.MATCH_CREATED,
      payload,
    });
  }

  /**
   * dating.boost.activated event'i yayınla
   */
  async publishBoostActivated(payload: {
    userId: string;
    expiresAt: Date;
  }): Promise<string> {
    return this.publisher.publish(DATING_TOPIC, {
      eventType: DATING_EVENT_TYPES.BOOST_ACTIVATED,
      payload,
    });
  }
}

export const createDatingSubscriptionName = (serviceName: string): string => {
  return `${serviceName}-dating-events`;
};
