import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Kanal ayarları (nested object)
 */
@Schema({ _id: false })
export class ChannelSettings {
  @Prop({ default: true })
  push: boolean;

  @Prop({ default: true })
  email: boolean;

  @Prop({ default: false })
  sms: boolean;
}

/**
 * Sosyal bildirim ayarları (nested object)
 */
@Schema({ _id: false })
export class SocialSettings {
  @Prop({ default: true })
  likes: boolean;

  @Prop({ default: true })
  comments: boolean;

  @Prop({ default: true })
  mentions: boolean;

  @Prop({ default: true })
  follows: boolean;

  @Prop({ default: true })
  reposts: boolean;
}

/**
 * Mesaj bildirim ayarları (nested object)
 */
@Schema({ _id: false })
export class MessageSettings {
  @Prop({ default: true })
  directMessages: boolean;

  @Prop({ default: true })
  groupMessages: boolean;

  @Prop({ default: true })
  messageRequests: boolean;
}

/**
 * Flört bildirim ayarları (nested object)
 */
@Schema({ _id: false })
export class DatingSettings {
  @Prop({ default: true })
  matches: boolean;

  @Prop({ default: true })
  likes: boolean;

  @Prop({ default: true })
  superLikes: boolean;
}

/**
 * İlan bildirim ayarları (nested object)
 */
@Schema({ _id: false })
export class ListingSettings {
  @Prop({ default: true })
  messages: boolean;

  @Prop({ default: true })
  priceDrops: boolean;

  @Prop({ default: true })
  savedSearchAlerts: boolean;
}

/**
 * Görüntüleme ayarları (nested object)
 */
@Schema({ _id: false })
export class DisplaySettings {
  @Prop({ default: true })
  sound: boolean;

  @Prop({ default: true })
  vibration: boolean;

  @Prop({ default: true })
  showPreview: boolean;

  @Prop({ default: true })
  badgeCount: boolean;
}

/**
 * Sessiz saatler (nested object)
 */
@Schema({ _id: false })
export class QuietHours {
  @Prop({ default: false })
  enabled: boolean;

  @Prop({ default: '23:00' })
  startTime: string;

  @Prop({ default: '07:00' })
  endTime: string;
}

/**
 * NotificationSettings Schema
 * 
 * Collection: notification_settings
 * 
 * Kullanıcı bildirim tercihleri:
 * - Kanal tercihleri (push, email, sms)
 * - Bildirim tipi tercihleri (sosyal, mesaj, flört, ilan)
 * - Görüntüleme tercihleri (ses, titreşim, önizleme)
 * - Sessiz saatler
 */
@Schema({
  collection: 'notification_settings',
  timestamps: false,
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
export class NotificationSettings {
  /**
   * Kullanıcı ID'si (unique)
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  /**
   * Kanal ayarları
   */
  @Prop({ type: ChannelSettings, default: () => ({}) })
  channels: ChannelSettings;

  /**
   * Sosyal bildirim ayarları
   */
  @Prop({ type: SocialSettings, default: () => ({}) })
  social: SocialSettings;

  /**
   * Mesaj bildirim ayarları
   */
  @Prop({ type: MessageSettings, default: () => ({}) })
  messages: MessageSettings;

  /**
   * Flört bildirim ayarları
   */
  @Prop({ type: DatingSettings, default: () => ({}) })
  dating: DatingSettings;

  /**
   * İlan bildirim ayarları
   */
  @Prop({ type: ListingSettings, default: () => ({}) })
  listings: ListingSettings;

  /**
   * Görüntüleme ayarları
   */
  @Prop({ type: DisplaySettings, default: () => ({}) })
  display: DisplaySettings;

  /**
   * Sessiz saatler
   */
  @Prop({ type: QuietHours, default: () => ({}) })
  quietHours: QuietHours;

  /**
   * Oluşturulma zamanı
   */
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  /**
   * Güncellenme zamanı
   */
  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export type NotificationSettingsDocument = NotificationSettings & Document;

export const NotificationSettingsSchema =
  SchemaFactory.createForClass(NotificationSettings);

// userId için unique index
NotificationSettingsSchema.index({ userId: 1 }, { unique: true });
