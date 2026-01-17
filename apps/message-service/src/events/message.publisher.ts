/**
 * Message Publisher
 * GCP Pub/Sub ile event yayınlama
 * Offline push notification ve diğer servisler için
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Gerçek implementasyonda @google-cloud/pubsub kullanılır
// import { PubSub } from '@google-cloud/pubsub';

// Event tipleri
export interface MessageSentEvent {
  messageId: string;
  conversationId: string;
  senderId: string;
  recipientIds: string[];
  type: string;
  preview: string;
}

export interface ConversationCreatedEvent {
  conversationId: string;
  type: string;
  creatorId: string;
  participantIds: string[];
}

export interface MatchCreatedEvent {
  matchId: string;
  conversationId: string;
  userIds: string[];
}

@Injectable()
export class MessagePublisher {
  private readonly logger = new Logger(MessagePublisher.name);
  private readonly isEnabled: boolean;

  // Gerçek implementasyonda Pub/Sub client
  // private readonly pubsub: PubSub;

  constructor(private readonly configService: ConfigService) {
    this.isEnabled =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (this.isEnabled) {
      // this.pubsub = new PubSub();
      this.logger.log('Pub/Sub publisher aktif');
    }
  }

  /**
   * Mesaj gönderildi event'i yayınla
   * Notification service bu event'i dinleyerek push notification gönderir
   */
  async publishMessageSent(event: MessageSentEvent): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug(`[DEV] MessageSent event: ${JSON.stringify(event)}`);
      return;
    }

    try {
      const topic = 'message-events';
      const data = {
        type: 'message.sent',
        data: event,
        timestamp: new Date().toISOString(),
      };

      // Gerçek implementasyon:
      // const dataBuffer = Buffer.from(JSON.stringify(data));
      // await this.pubsub.topic(topic).publish(dataBuffer);

      this.logger.debug(`Event yayınlandı: ${topic} - message.sent`);
    } catch (error) {
      this.logger.error(`Pub/Sub hata: ${error.message}`);
    }
  }

  /**
   * Sohbet oluşturuldu event'i yayınla
   */
  async publishConversationCreated(
    event: ConversationCreatedEvent,
  ): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug(
        `[DEV] ConversationCreated event: ${JSON.stringify(event)}`,
      );
      return;
    }

    try {
      const topic = 'message-events';
      const data = {
        type: 'conversation.created',
        data: event,
        timestamp: new Date().toISOString(),
      };

      // Gerçek implementasyon:
      // const dataBuffer = Buffer.from(JSON.stringify(data));
      // await this.pubsub.topic(topic).publish(dataBuffer);

      this.logger.debug(`Event yayınlandı: ${topic} - conversation.created`);
    } catch (error) {
      this.logger.error(`Pub/Sub hata: ${error.message}`);
    }
  }

  /**
   * Match oluşturuldu event'i yayınla
   * Dating service'den gelen match için sohbet oluşturulduğunda
   */
  async publishMatchCreated(event: MatchCreatedEvent): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug(`[DEV] MatchCreated event: ${JSON.stringify(event)}`);
      return;
    }

    try {
      const topic = 'dating-events';
      const data = {
        type: 'match.conversation.created',
        data: event,
        timestamp: new Date().toISOString(),
      };

      this.logger.debug(`Event yayınlandı: ${topic} - match.conversation.created`);
    } catch (error) {
      this.logger.error(`Pub/Sub hata: ${error.message}`);
    }
  }
}
