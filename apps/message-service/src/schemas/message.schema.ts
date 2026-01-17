/**
 * Message Schema
 * Mesaj MongoDB şeması
 * E2EE destekli şifreli mesaj yapısı
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

// Şifreli içerik alt şeması
@Schema({ _id: false })
class EncryptedContent {
  @Prop({ type: String, required: true })
  content: string; // Base64 encoded şifreli içerik

  @Prop({ type: String, required: true })
  nonce: string; // Base64 encoded nonce

  @Prop({ type: String, default: 'x25519-aes256gcm' })
  algorithm: string;
}

const EncryptedContentSchema = SchemaFactory.createForClass(EncryptedContent);

// Media alt şeması
@Schema({ _id: false })
class Media {
  @Prop({ type: String })
  url: string;

  @Prop({ type: String })
  thumbnailUrl?: string;

  @Prop({ type: String })
  mimeType: string;

  @Prop({ type: Number })
  size: number;

  @Prop({ type: Number })
  width?: number;

  @Prop({ type: Number })
  height?: number;

  @Prop({ type: Number })
  duration?: number;

  @Prop({ type: String })
  fileName?: string;
}

const MediaSchema = SchemaFactory.createForClass(Media);

// Delivery durumu - alıcı bazlı
@Schema({ _id: false })
class DeliveryReceipt {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  at: Date;
}

const DeliveryReceiptSchema = SchemaFactory.createForClass(DeliveryReceipt);

// Status alt şeması
@Schema({ _id: false })
class MessageStatus {
  @Prop({ type: Date, default: Date.now })
  sent: Date;

  @Prop({ type: [DeliveryReceiptSchema], default: [] })
  delivered: DeliveryReceipt[];

  @Prop({ type: [DeliveryReceiptSchema], default: [] })
  read: DeliveryReceipt[];
}

const MessageStatusSchema = SchemaFactory.createForClass(MessageStatus);

// System event alt şeması
@Schema({ _id: false })
class SystemEvent {
  @Prop({
    type: String,
    enum: ['created', 'user_joined', 'user_left', 'renamed'],
  })
  type: string;

  @Prop({ type: Object })
  data?: Record<string, any>;
}

const SystemEventSchema = SchemaFactory.createForClass(SystemEvent);

// Ana Message şeması
@Schema({
  collection: 'messages',
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
export class Message {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Conversation' })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['text', 'image', 'video', 'voice', 'file', 'system'],
    default: 'text',
  })
  type: string;

  @Prop({ type: EncryptedContentSchema, required: true })
  encrypted: EncryptedContent;

  @Prop({ type: MediaSchema })
  media?: Media;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyTo?: Types.ObjectId;

  @Prop({ type: String })
  senderPublicKey?: string; // Şifre çözmek için gönderenin public key'i

  @Prop({ type: MessageStatusSchema, default: () => ({}) })
  status: MessageStatus;

  @Prop({ type: [Types.ObjectId], default: [] })
  deletedFor: Types.ObjectId[]; // Soft delete per user

  @Prop({ type: SystemEventSchema })
  systemEvent?: SystemEvent;

  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexler
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, _id: -1 }); // Cursor pagination
MessageSchema.index({ senderId: 1, createdAt: -1 });

// TTL index (opsiyonel - auto delete için)
// MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 gün
