import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Bildirim tipleri
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
 * Hedef tipi
 */
export enum TargetType {
  POST = 'post',
  COMMENT = 'comment',
  USER = 'user',
  CONVERSATION = 'conversation',
  MATCH = 'match',
  LISTING = 'listing',
}

/**
 * Bildirim hedefi (nested object)
 */
@Schema({ _id: false })
export class NotificationTarget {
  @Prop({
    type: String,
    enum: Object.values(TargetType),
    required: true,
  })
  type: TargetType;

  @Prop({ type: Types.ObjectId, required: true })
  id: Types.ObjectId;
}

/**
 * Bildirim içeriği (nested object)
 */
@Schema({ _id: false })
export class NotificationContent {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop()
  imageUrl?: string;
}

/**
 * Notification Schema
 * 
 * Collection: notifications
 * 
 * Bu şema, tüm bildirim tiplerini saklar:
 * - Sosyal etkileşimler (like, comment, follow vs.)
 * - Mesaj bildirimleri
 * - Flört bildirimleri (match)
 * - İlan bildirimleri
 * - Sistem bildirimleri
 */
@Schema({
  collection: 'notifications',
  timestamps: false, // Manuel yönetiyoruz
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Notification {
  /**
   * Bildirim sahibi kullanıcı ID'si
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  /**
   * Bildirimi tetikleyen kullanıcı ID'si
   * Sistem bildirimleri için boş olabilir
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  actorId?: Types.ObjectId;

  /**
   * Bildirim tipi
   */
  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    required: true,
    index: true,
  })
  type: NotificationType;

  /**
   * Bildirim hedefi (post, comment, user vs.)
   */
  @Prop({ type: NotificationTarget })
  target?: NotificationTarget;

  /**
   * Bildirim içeriği
   */
  @Prop({ type: NotificationContent, required: true })
  content: NotificationContent;

  /**
   * Ek veri (deeplinking için)
   */
  @Prop({ type: Object })
  data?: Record<string, any>;

  /**
   * Okundu mu?
   */
  @Prop({ default: false, index: true })
  isRead: boolean;

  /**
   * Okunma zamanı
   */
  @Prop({ type: Date })
  readAt?: Date;

  /**
   * Oluşturulma zamanı
   */
  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;
}

export type NotificationDocument = Notification & Document;

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Compound indexes
// Kullanıcının bildirimleri (zaman sıralı)
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Kullanıcının okunmamış bildirimleri
NotificationSchema.index({ userId: 1, isRead: 1 });

// TTL index - 90 gün sonra otomatik sil
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }, // 90 gün
);
