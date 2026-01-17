import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminLogDocument = AdminLog & Document;

/**
 * Admin işlem log şeması
 * 
 * TTL: 365 gün sonra otomatik silinir
 */
@Schema({
  collection: 'admin_logs',
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
export class AdminLog {
  @Prop({
    type: Types.ObjectId,
    ref: 'AdminUser',
    required: true,
    index: true,
  })
  adminId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    index: true,
    /**
     * İşlem türleri:
     * - admin_login, admin_logout, password_changed
     * - user_banned, user_unbanned, user_suspended, user_unsuspended
     * - user_verified, user_unverified, user_updated
     * - post_deleted, post_hidden, comment_deleted
     * - report_resolved, report_dismissed
     * - flag_created, flag_updated, flag_deleted
     * - admin_created, admin_updated
     * - settings_changed
     */
  })
  action: string;

  @Prop({
    type: {
      type: String,
      enum: ['user', 'post', 'comment', 'listing', 'report', 'flag', 'admin', 'system'],
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
    type: {
      before: { type: Object, default: null },
      after: { type: Object, default: null },
      reason: { type: String, default: null },
    },
    default: {},
  })
  details: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    reason?: string;
  };

  @Prop({ type: String, default: null })
  ip: string;

  @Prop({ type: String, default: null })
  userAgent: string;

  @Prop({ type: Date })
  createdAt: Date;
}

export const AdminLogSchema = SchemaFactory.createForClass(AdminLog);

// İndeksler
AdminLogSchema.index({ adminId: 1, createdAt: -1 });
AdminLogSchema.index({ action: 1, createdAt: -1 });
AdminLogSchema.index({ 'target.type': 1, 'target.id': 1 });
AdminLogSchema.index({ createdAt: -1 });

// TTL indeksi - 365 gün sonra sil
AdminLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
