/**
 * Messaging Settings Schema
 * Kullanıcı mesajlaşma ayarları MongoDB şeması
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessagingSettingsDocument = MessagingSettings & Document;

// Sessiz saatler alt şeması
@Schema({ _id: false })
class QuietHours {
  @Prop({ type: Boolean, default: false })
  enabled: boolean;

  @Prop({ type: String })
  startTime?: string; // "23:00"

  @Prop({ type: String })
  endTime?: string; // "07:00"
}

const QuietHoursSchema = SchemaFactory.createForClass(QuietHours);

// Ana Messaging Settings şeması
@Schema({
  collection: 'messaging_settings',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class MessagingSettings {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  userId: Types.ObjectId;

  // Privacy ayarları
  @Prop({ type: Boolean, default: true })
  showOnlineStatus: boolean;

  @Prop({ type: Boolean, default: true })
  showLastSeen: boolean;

  @Prop({ type: Boolean, default: true })
  showTypingIndicator: boolean;

  @Prop({ type: Boolean, default: true })
  showReadReceipts: boolean;

  // İndirme ayarları
  @Prop({
    type: String,
    enum: ['always', 'wifi', 'never'],
    default: 'wifi',
  })
  mediaAutoDownload: string;

  // Otomatik silme (Premium)
  @Prop({
    type: String,
    enum: ['off', '24h', '7d', '30d'],
    default: 'off',
  })
  autoDeleteMessages: string;

  // Sessiz saatler
  @Prop({ type: QuietHoursSchema, default: () => ({ enabled: false }) })
  quietHours: QuietHours;

  // Engellenen kullanıcılar
  @Prop({ type: [Types.ObjectId], default: [] })
  blockedUsers: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

export const MessagingSettingsSchema =
  SchemaFactory.createForClass(MessagingSettings);

// Index
MessagingSettingsSchema.index({ userId: 1 }, { unique: true });
