import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema';

/**
 * In-App Notification Payload
 */
export interface InAppNotificationPayload {
  userId: string;
  actorId?: string;
  type: string;
  target?: {
    type: string;
    id: string;
  };
  content: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data?: Record<string, any>;
}

/**
 * In-App Service
 * 
 * Uygulama içi bildirimler için servis
 * MongoDB'ye bildirim kaydı ve yönetimi
 * 
 * Özellikler:
 * - Bildirim oluşturma
 * - Gruplama (aynı tip bildirimler için)
 * - Badge count yönetimi
 */
@Injectable()
export class InAppService {
  private readonly logger = new Logger(InAppService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * In-app bildirim oluştur
   */
  async create(payload: InAppNotificationPayload): Promise<Notification> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(payload.userId),
      actorId: payload.actorId
        ? new Types.ObjectId(payload.actorId)
        : undefined,
      type: payload.type,
      target: payload.target
        ? {
            type: payload.target.type,
            id: new Types.ObjectId(payload.target.id),
          }
        : undefined,
      content: payload.content,
      data: payload.data,
      isRead: false,
      createdAt: new Date(),
    });

    await notification.save();

    this.logger.debug(
      `In-app bildirim oluşturuldu: id=${notification._id}, userId=${payload.userId}, type=${payload.type}`,
    );

    return notification;
  }

  /**
   * Benzer bildirimleri grupla
   * Örn: "Ali ve 5 kişi daha gönderinizi beğendi"
   */
  async createGrouped(
    userId: string,
    type: string,
    targetId: string,
    actorIds: string[],
    content: { title: string; body: string },
  ): Promise<Notification> {
    // Son 24 saat içindeki benzer bildirimi bul
    const existingNotification = await this.notificationModel.findOne({
      userId: new Types.ObjectId(userId),
      type,
      'target.id': new Types.ObjectId(targetId),
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      isRead: false,
    });

    if (existingNotification) {
      // Mevcut bildirimi güncelle
      const existingActors = existingNotification.data?.actorIds || [];
      const newActors = [...new Set([...existingActors, ...actorIds])];
      
      const updatedContent = this.getGroupedContent(
        content,
        newActors.length,
      );

      existingNotification.content = updatedContent;
      existingNotification.data = {
        ...existingNotification.data,
        actorIds: newActors,
        groupCount: newActors.length,
      };
      existingNotification.createdAt = new Date();

      await existingNotification.save();

      this.logger.debug(
        `Gruplanmış bildirim güncellendi: id=${existingNotification._id}, count=${newActors.length}`,
      );

      return existingNotification;
    }

    // Yeni gruplanmış bildirim oluştur
    return this.create({
      userId,
      actorId: actorIds[0],
      type,
      target: { type: 'post', id: targetId },
      content: this.getGroupedContent(content, actorIds.length),
      data: {
        actorIds,
        groupCount: actorIds.length,
      },
    });
  }

  /**
   * Gruplanmış içerik oluştur
   */
  private getGroupedContent(
    baseContent: { title: string; body: string },
    count: number,
  ): { title: string; body: string } {
    if (count <= 1) {
      return baseContent;
    }

    return {
      title: baseContent.title,
      body: baseContent.body.replace(
        /^(\S+)/,
        `$1 ve ${count - 1} kişi daha`,
      ),
    };
  }

  /**
   * Kullanıcının okunmamış bildirim sayısını al (badge count)
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  /**
   * Tip bazlı okunmamış sayıları al
   */
  async getUnreadCountsByType(
    userId: string,
  ): Promise<Record<string, number>> {
    const result = await this.notificationModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          isRead: false,
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    return result.reduce(
      (acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Eski bildirimleri temizle (cleanup job için)
   */
  async cleanupOldNotifications(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.notificationModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    this.logger.log(
      `Eski bildirimler temizlendi: count=${result.deletedCount}, olderThan=${daysToKeep} gün`,
    );

    return result.deletedCount;
  }

  /**
   * Kullanıcının tüm bildirimlerini sil
   */
  async deleteAllForUser(userId: string): Promise<number> {
    const result = await this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });

    this.logger.log(
      `Kullanıcı bildirimleri silindi: userId=${userId}, count=${result.deletedCount}`,
    );

    return result.deletedCount;
  }

  /**
   * Belirli bir hedef için bildirimleri sil
   * Örn: Post silindiğinde o post'a ait tüm bildirimleri sil
   */
  async deleteForTarget(targetType: string, targetId: string): Promise<number> {
    const result = await this.notificationModel.deleteMany({
      'target.type': targetType,
      'target.id': new Types.ObjectId(targetId),
    });

    this.logger.debug(
      `Hedef bildirimleri silindi: targetType=${targetType}, targetId=${targetId}, count=${result.deletedCount}`,
    );

    return result.deletedCount;
  }
}
