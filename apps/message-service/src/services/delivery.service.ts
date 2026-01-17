/**
 * Delivery Service
 * Mesaj iletim ve okunma durumu yönetimi
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  /**
   * Mesajı iletildi olarak işaretle
   */
  async markDelivered(
    messageId: string,
    userId: string,
  ): Promise<{ senderId: string; conversationId: string } | null> {
    const msgObjectId = new Types.ObjectId(messageId);
    const userObjectId = new Types.ObjectId(userId);

    // Mesajı bul ve güncelle
    const message = await this.messageModel.findOneAndUpdate(
      {
        _id: msgObjectId,
        senderId: { $ne: userObjectId }, // Kendi mesajını işaretleme
        'status.delivered.userId': { $ne: userObjectId }, // Zaten işaretlenmemiş
      },
      {
        $push: {
          'status.delivered': {
            userId: userObjectId,
            at: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!message) {
      return null;
    }

    this.logger.debug(`Mesaj iletildi: ${messageId} -> ${userId}`);

    return {
      senderId: message.senderId.toString(),
      conversationId: message.conversationId.toString(),
    };
  }

  /**
   * Mesajı okundu olarak işaretle
   * Belirtilen mesaja kadar olan tüm mesajları okundu yapar
   */
  async markRead(
    conversationId: string,
    userId: string,
    upToMessageId: string,
  ): Promise<number> {
    const convObjectId = new Types.ObjectId(conversationId);
    const userObjectId = new Types.ObjectId(userId);
    const upToMsgObjectId = new Types.ObjectId(upToMessageId);

    // Belirtilen mesaja kadar olan okunmamış mesajları bul
    const result = await this.messageModel.updateMany(
      {
        conversationId: convObjectId,
        senderId: { $ne: userObjectId }, // Kendi mesajlarını hariç tut
        _id: { $lte: upToMsgObjectId }, // Belirtilen mesaja kadar
        'status.read.userId': { $ne: userObjectId }, // Zaten okunmamış
      },
      {
        $push: {
          'status.read': {
            userId: userObjectId,
            at: new Date(),
          },
        },
      },
    );

    this.logger.debug(
      `${result.modifiedCount} mesaj okundu: Conv ${conversationId} - User ${userId}`,
    );

    return result.modifiedCount;
  }

  /**
   * Tek mesajı okundu olarak işaretle
   */
  async markSingleRead(
    messageId: string,
    userId: string,
  ): Promise<{ senderId: string; conversationId: string } | null> {
    const msgObjectId = new Types.ObjectId(messageId);
    const userObjectId = new Types.ObjectId(userId);

    const message = await this.messageModel.findOneAndUpdate(
      {
        _id: msgObjectId,
        senderId: { $ne: userObjectId },
        'status.read.userId': { $ne: userObjectId },
      },
      {
        $push: {
          'status.read': {
            userId: userObjectId,
            at: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!message) {
      return null;
    }

    return {
      senderId: message.senderId.toString(),
      conversationId: message.conversationId.toString(),
    };
  }

  /**
   * Mesajın iletim durumunu getir
   */
  async getDeliveryStatus(messageId: string): Promise<{
    sent: Date;
    delivered: Array<{ userId: string; at: Date }>;
    read: Array<{ userId: string; at: Date }>;
  } | null> {
    const message = await this.messageModel
      .findById(messageId)
      .select('status')
      .lean();

    if (!message) {
      return null;
    }

    return {
      sent: message.status.sent,
      delivered: message.status.delivered.map((d: any) => ({
        userId: d.userId.toString(),
        at: d.at,
      })),
      read: message.status.read.map((r: any) => ({
        userId: r.userId.toString(),
        at: r.at,
      })),
    };
  }

  /**
   * Sohbetteki okunmamış mesaj sayısını getir
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const convObjectId = new Types.ObjectId(conversationId);
    const userObjectId = new Types.ObjectId(userId);

    const count = await this.messageModel.countDocuments({
      conversationId: convObjectId,
      senderId: { $ne: userObjectId },
      'status.read.userId': { $ne: userObjectId },
    });

    return count;
  }

  /**
   * Tüm sohbetlerdeki okunmamış mesaj sayısını getir
   */
  async getTotalUnreadCount(
    userId: string,
    conversationIds: string[],
  ): Promise<number> {
    const userObjectId = new Types.ObjectId(userId);
    const convObjectIds = conversationIds.map((id) => new Types.ObjectId(id));

    const count = await this.messageModel.countDocuments({
      conversationId: { $in: convObjectIds },
      senderId: { $ne: userObjectId },
      'status.read.userId': { $ne: userObjectId },
    });

    return count;
  }
}
