/**
 * Message Service
 * Mesajlaşma işlemlerini koordine eden ana servis
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Schemas
import { Message, MessageDocument } from './schemas/message.schema';
import {
  MessagingSettings,
  MessagingSettingsDocument,
} from './schemas/messaging-settings.schema';

// Services
import { ConversationService } from './services/conversation.service';
import { MessageCrudService } from './services/message-crud.service';
import { DeliveryService } from './services/delivery.service';
import { MessagePublisher } from './events/message.publisher';

// DTOs
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessagingSettingsDto } from './dto/update-messaging-settings.dto';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectModel(MessagingSettings.name)
    private messagingSettingsModel: Model<MessagingSettingsDocument>,
    private readonly conversationService: ConversationService,
    private readonly messageCrudService: MessageCrudService,
    private readonly deliveryService: DeliveryService,
    private readonly messagePublisher: MessagePublisher,
  ) {}

  /**
   * Mesaj gönder
   */
  async sendMessage(
    senderId: string,
    conversationId: string,
    dto: SendMessageDto,
  ): Promise<any> {
    // 1. Mesajı kaydet
    const message = await this.messageCrudService.createMessage(
      conversationId,
      senderId,
      dto,
    );

    // 2. Conversation'ın lastMessage'ını güncelle
    await this.conversationService.updateLastMessage(conversationId, {
      messageId: message._id.toString(),
      senderId,
      preview: this.getMessagePreview(dto),
      type: dto.type,
      sentAt: message.createdAt,
    });

    // 3. Offline kullanıcılar için push notification event'i yayınla
    const offlineParticipants =
      await this.conversationService.getOfflineParticipants(
        conversationId,
        senderId,
      );

    if (offlineParticipants.length > 0) {
      await this.messagePublisher.publishMessageSent({
        messageId: message._id.toString(),
        conversationId,
        senderId,
        recipientIds: offlineParticipants,
        type: dto.type,
        preview: this.getMessagePreview(dto),
      });
    }

    this.logger.debug(
      `Mesaj gönderildi: ${message._id} (Conversation: ${conversationId})`,
    );

    return {
      id: message._id.toString(),
      conversationId,
      senderId,
      type: dto.type,
      encrypted: dto.encrypted,
      media: dto.media,
      replyTo: dto.replyTo,
      senderPublicKey: message.senderPublicKey,
      createdAt: message.createdAt,
    };
  }

  /**
   * Mesajı okundu olarak işaretle
   */
  async markAsRead(
    conversationId: string,
    userId: string,
    messageId: string,
  ): Promise<void> {
    // Mesajları okundu olarak işaretle
    await this.deliveryService.markRead(conversationId, userId, messageId);

    // Conversation'daki unread count'u sıfırla
    await this.conversationService.resetUnreadCount(conversationId, userId);

    this.logger.debug(
      `Mesajlar okundu: ${conversationId} - User: ${userId} - Until: ${messageId}`,
    );
  }

  /**
   * Kullanıcının public key'lerini getir
   */
  async getUserPublicKeys(userId: string): Promise<any[]> {
    // Bu normalde user-service'den gelir, burada basitleştirilmiş versiyon
    // Gerçek implementasyonda HTTP call veya shared database kullanılır
    return [
      {
        publicKey: 'base64_public_key_placeholder',
        deviceId: 'device_1',
        deviceName: 'Primary Device',
        isActive: true,
      },
    ];
  }

  /**
   * Mesajlaşma ayarlarını getir
   */
  async getMessagingSettings(userId: string): Promise<any> {
    let settings = await this.messagingSettingsModel.findOne({ userId });

    if (!settings) {
      // Varsayılan ayarları döndür
      return {
        showOnlineStatus: true,
        showLastSeen: true,
        showTypingIndicator: true,
        showReadReceipts: true,
        mediaAutoDownload: 'wifi',
        autoDeleteMessages: 'off',
        quietHours: {
          enabled: false,
          startTime: null,
          endTime: null,
        },
        blockedUsers: [],
      };
    }

    return settings;
  }

  /**
   * Mesajlaşma ayarlarını güncelle
   */
  async updateMessagingSettings(
    userId: string,
    dto: UpdateMessagingSettingsDto,
  ): Promise<any> {
    const settings = await this.messagingSettingsModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...dto,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId,
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    this.logger.debug(`Mesajlaşma ayarları güncellendi: ${userId}`);

    return settings;
  }

  /**
   * Kullanıcıyı engelle
   */
  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    await this.messagingSettingsModel.findOneAndUpdate(
      { userId },
      {
        $addToSet: { blockedUsers: blockedUserId },
        $set: { updatedAt: new Date() },
        $setOnInsert: {
          userId,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    this.logger.debug(`Kullanıcı engellendi: ${userId} -> ${blockedUserId}`);
  }

  /**
   * Kullanıcı engelini kaldır
   */
  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    await this.messagingSettingsModel.findOneAndUpdate(
      { userId },
      {
        $pull: { blockedUsers: blockedUserId },
        $set: { updatedAt: new Date() },
      },
    );

    this.logger.debug(`Kullanıcı engeli kaldırıldı: ${userId} -> ${blockedUserId}`);
  }

  /**
   * Kullanıcının engellenip engellenmediğini kontrol et
   */
  async isBlocked(userId: string, otherUserId: string): Promise<boolean> {
    const settings = await this.messagingSettingsModel.findOne({
      userId,
      blockedUsers: otherUserId,
    });

    return !!settings;
  }

  /**
   * Mesaj önizlemesi oluştur
   */
  private getMessagePreview(dto: SendMessageDto): string {
    switch (dto.type) {
      case 'image':
        return '📷 Fotoğraf';
      case 'video':
        return '🎥 Video';
      case 'voice':
        return '🎤 Sesli mesaj';
      case 'file':
        return '📎 Dosya';
      case 'system':
        return 'Sistem mesajı';
      default:
        // Text mesajlar için ilk 50 karakter (şifreli olduğu için preview yok)
        return 'Yeni mesaj';
    }
  }
}
