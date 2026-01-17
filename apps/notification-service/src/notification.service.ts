import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import {
  NotificationSettings,
  NotificationSettingsDocument,
} from './schemas/notification-settings.schema';
import { NotificationQueryDto } from './dto/notification-query.dto';
import {
  UpdateNotificationSettingsDto,
  RegisterDeviceDto,
} from './dto/notification-settings.dto';
import { PushService } from './services/push.service';
import { EmailService } from './services/email.service';
import { InAppService } from './services/in-app.service';

/**
 * Bildirim Tipleri
 */
export enum NotificationType {
  // Sosyal etkileşimler
  LIKE = 'like',
  DISLIKE = 'dislike',
  COMMENT = 'comment',
  REPLY = 'reply',
  MENTION = 'mention',
  
  // Takip
  FOLLOW = 'follow',
  FOLLOW_REQUEST = 'follow_request',
  FOLLOW_ACCEPTED = 'follow_accepted',
  
  // Paylaşım
  REPOST = 'repost',
  QUOTE = 'quote',
  
  // Mesajlaşma
  MESSAGE = 'message',
  
  // Flört
  MATCH = 'match',
  
  // İlan
  LISTING_MESSAGE = 'listing_message',
  LISTING_FAVORITE = 'listing_favorite',
  
  // Sistem
  SYSTEM = 'system',
}

/**
 * Bildirim oluşturma parametreleri
 */
export interface CreateNotificationParams {
  userId: string;
  actorId?: string;
  type: NotificationType;
  target?: {
    type: 'post' | 'comment' | 'user' | 'conversation' | 'match' | 'listing';
    id: string;
  };
  content: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data?: Record<string, any>;
  sendPush?: boolean;
  sendEmail?: boolean;
}

/**
 * Notification Service
 * 
 * Ana bildirim servisi - tüm bildirim işlemlerini koordine eder
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationSettings.name)
    private settingsModel: Model<NotificationSettingsDocument>,
    private pushService: PushService,
    private emailService: EmailService,
    private inAppService: InAppService,
  ) {}

  /**
   * Yeni bildirim oluştur ve gönder
   */
  async create(params: CreateNotificationParams): Promise<Notification> {
    const {
      userId,
      actorId,
      type,
      target,
      content,
      data,
      sendPush = true,
      sendEmail = false,
    } = params;

    // Kullanıcı ayarlarını kontrol et
    const settings = await this.getOrCreateSettings(userId);
    
    // Bu tip bildirim için ayar kontrolü
    const shouldNotify = this.shouldSendNotification(settings, type);
    
    if (!shouldNotify) {
      this.logger.debug(
        `Bildirim gönderilmedi - kullanıcı ayarları: ${userId}, type: ${type}`,
      );
      return null;
    }

    // Sessiz saatler kontrolü
    if (this.isQuietHours(settings)) {
      this.logger.debug(`Sessiz saatler aktif: ${userId}`);
      // Sadece in-app bildirim oluştur, push gönderme
      sendPush && (params.sendPush = false);
    }

    // In-app bildirim oluştur
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      type,
      target: target
        ? {
            type: target.type,
            id: new Types.ObjectId(target.id),
          }
        : undefined,
      content,
      data,
      isRead: false,
      createdAt: new Date(),
    });

    await notification.save();
    this.logger.log(`Bildirim oluşturuldu: ${notification._id}, type: ${type}`);

    // Push notification gönder
    if (sendPush && settings.channels?.push) {
      await this.pushService.send(userId, {
        title: content.title,
        body: content.body,
        imageUrl: content.imageUrl,
        data: {
          notificationId: notification._id.toString(),
          type,
          targetType: target?.type,
          targetId: target?.id,
          ...data,
        },
      });
    }

    // Email bildirim gönder
    if (sendEmail && settings.channels?.email) {
      await this.emailService.sendNotificationEmail(userId, {
        type,
        title: content.title,
        body: content.body,
      });
    }

    return notification;
  }

  /**
   * Bildirimleri listele (pagination ile)
   */
  async getNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<{
    notifications: Notification[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    const { cursor, limit = 20, type } = query;

    const filter: any = {
      userId: new Types.ObjectId(userId),
    };

    // Cursor varsa, ondan önceki kayıtları getir
    if (cursor) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    // Tip filtresi
    if (type) {
      filter.type = type;
    }

    const notifications = await this.notificationModel
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1) // Bir fazla al, hasMore kontrolü için
      .lean()
      .exec();

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore
      ? items[items.length - 1]._id.toString()
      : undefined;

    return {
      notifications: items as Notification[],
      hasMore,
      nextCursor,
    };
  }

  /**
   * Okunmamış bildirim sayısı
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  /**
   * Tek bildirimi okundu işaretle
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const result = await this.notificationModel.updateOne(
      {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('Bildirim bulunamadı');
    }
  }

  /**
   * Tüm bildirimleri okundu işaretle
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    return result.modifiedCount;
  }

  /**
   * Bildirimi sil
   */
  async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    const result = await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Bildirim bulunamadı');
    }
  }

  /**
   * Bildirim ayarlarını getir
   */
  async getSettings(userId: string): Promise<NotificationSettings> {
    return this.getOrCreateSettings(userId);
  }

  /**
   * Bildirim ayarlarını güncelle
   */
  async updateSettings(
    userId: string,
    updateDto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    const settings = await this.settingsModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          ...updateDto,
          updatedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    return settings;
  }

  /**
   * FCM cihaz token'ı kaydet
   */
  async registerDevice(
    userId: string,
    registerDto: RegisterDeviceDto,
  ): Promise<void> {
    const { token, deviceId, platform } = registerDto;

    // User service'e FCM token kaydet
    // Bu normalde user-service'e HTTP call yapılacak
    this.logger.log(
      `Cihaz kaydedildi: userId=${userId}, deviceId=${deviceId}, platform=${platform}`,
    );

    // PushService'e token'ı ekle
    await this.pushService.registerToken(userId, token, deviceId, platform);
  }

  /**
   * FCM cihaz token'ı sil
   */
  async removeDevice(userId: string, deviceId: string): Promise<void> {
    await this.pushService.removeToken(userId, deviceId);
    this.logger.log(`Cihaz silindi: userId=${userId}, deviceId=${deviceId}`);
  }

  /**
   * Ayarları getir veya varsayılanları oluştur
   */
  private async getOrCreateSettings(
    userId: string,
  ): Promise<NotificationSettings> {
    let settings = await this.settingsModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!settings) {
      settings = new this.settingsModel({
        userId: new Types.ObjectId(userId),
        channels: {
          push: true,
          email: true,
          sms: false,
        },
        social: {
          likes: true,
          comments: true,
          mentions: true,
          follows: true,
          reposts: true,
        },
        messages: {
          directMessages: true,
          groupMessages: true,
          messageRequests: true,
        },
        dating: {
          matches: true,
          likes: true,
          superLikes: true,
        },
        listings: {
          messages: true,
          priceDrops: true,
          savedSearchAlerts: true,
        },
        display: {
          sound: true,
          vibration: true,
          showPreview: true,
          badgeCount: true,
        },
        quietHours: {
          enabled: false,
          startTime: '23:00',
          endTime: '07:00',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await settings.save();
    }

    return settings;
  }

  /**
   * Bildirim tipi için ayar kontrolü
   */
  private shouldSendNotification(
    settings: NotificationSettings,
    type: NotificationType,
  ): boolean {
    switch (type) {
      case NotificationType.LIKE:
      case NotificationType.DISLIKE:
        return settings.social?.likes ?? true;
      case NotificationType.COMMENT:
      case NotificationType.REPLY:
        return settings.social?.comments ?? true;
      case NotificationType.MENTION:
        return settings.social?.mentions ?? true;
      case NotificationType.FOLLOW:
      case NotificationType.FOLLOW_REQUEST:
      case NotificationType.FOLLOW_ACCEPTED:
        return settings.social?.follows ?? true;
      case NotificationType.REPOST:
      case NotificationType.QUOTE:
        return settings.social?.reposts ?? true;
      case NotificationType.MESSAGE:
        return settings.messages?.directMessages ?? true;
      case NotificationType.MATCH:
        return settings.dating?.matches ?? true;
      case NotificationType.LISTING_MESSAGE:
        return settings.listings?.messages ?? true;
      case NotificationType.LISTING_FAVORITE:
        return true;
      case NotificationType.SYSTEM:
        return true;
      default:
        return true;
    }
  }

  /**
   * Sessiz saatler kontrolü
   */
  private isQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const { startTime, endTime } = settings.quietHours;

    // Gece yarısını geçen durumlar için kontrol
    if (startTime > endTime) {
      // Örn: 23:00 - 07:00
      return currentTime >= startTime || currentTime < endTime;
    }

    // Normal durum
    return currentTime >= startTime && currentTime < endTime;
  }
}
