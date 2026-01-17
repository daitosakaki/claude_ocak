import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

/**
 * Şikayet nedenleri
 */
export enum ReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE = 'inappropriate',
  FAKE = 'fake',
  VIOLENCE = 'violence',
  HATE_SPEECH = 'hate_speech',
  SCAM = 'scam',
  OTHER = 'other',
}

/**
 * Şikayet durumları
 */
export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

/**
 * Çözüm aksiyonları
 */
export enum ReportAction {
  NONE = 'none',
  WARNING = 'warning',
  CONTENT_REMOVED = 'content_removed',
  USER_SUSPENDED = 'user_suspended',
  USER_BANNED = 'user_banned',
}

/**
 * Şikayet şeması
 */
@Schema({
  collection: 'reports',
  timestamps: true,
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
export class Report {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  reporterId: Types.ObjectId;

  @Prop({
    type: {
      type: String,
      enum: ['user', 'post', 'comment', 'listing', 'message'],
      required: true,
    },
    id: {
      type: Types.ObjectId,
      required: true,
    },
  })
  target: {
    type: string;
    id: Types.ObjectId;
  };

  @Prop({
    type: String,
    enum: Object.values(ReportReason),
    required: true,
    index: true,
  })
  reason: ReportReason;

  @Prop({
    type: String,
    maxlength: 1000,
    default: null,
  })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(ReportStatus),
    default: ReportStatus.PENDING,
    index: true,
  })
  status: ReportStatus;

  @Prop({
    type: {
      action: {
        type: String,
        enum: Object.values(ReportAction),
      },
      resolvedBy: {
        type: Types.ObjectId,
        ref: 'AdminUser',
      },
      resolvedAt: Date,
      notes: String,
    },
    default: null,
  })
  resolution: {
    action: ReportAction;
    resolvedBy: Types.ObjectId;
    resolvedAt: Date;
    notes?: string;
  };

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// İndeksler
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ 'target.type': 1, 'target.id': 1 });
ReportSchema.index({ reporterId: 1 });
ReportSchema.index({ reason: 1, status: 1 });
