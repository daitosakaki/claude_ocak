import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminUserDocument = AdminUser & Document;

/**
 * Admin rolleri
 */
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
  ANALYST = 'analyst',
}

/**
 * Admin durumları
 */
export enum AdminStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

/**
 * Admin kullanıcı şeması
 */
@Schema({
  collection: 'admin_users',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      return ret;
    },
  },
})
export class AdminUser {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
    select: false, // Varsayılan olarak sorguya dahil etme
  })
  passwordHash: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  })
  name: string;

  @Prop({
    type: String,
    default: null,
  })
  avatar: string;

  @Prop({
    type: String,
    enum: Object.values(AdminRole),
    required: true,
  })
  role: AdminRole;

  @Prop({
    type: [String],
    default: [],
    /**
     * Mevcut izinler:
     * - users:read, users:write, users:delete, users:ban, users:suspend, users:verify
     * - posts:read, posts:delete
     * - reports:read, reports:manage
     * - flags:read, flags:write
     * - analytics:read
     * - logs:read
     * - admins:read, admins:write
     */
  })
  permissions: string[];

  @Prop({
    type: String,
    enum: Object.values(AdminStatus),
    default: AdminStatus.ACTIVE,
  })
  status: AdminStatus;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date;

  @Prop({ type: String, default: null })
  lastLoginIp: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);

// İndeksler
AdminUserSchema.index({ email: 1 }, { unique: true });
AdminUserSchema.index({ role: 1 });
AdminUserSchema.index({ status: 1 });

/**
 * Rol bazlı varsayılan izinler
 */
export const DEFAULT_PERMISSIONS: Record<AdminRole, string[]> = {
  [AdminRole.SUPER_ADMIN]: [
    'users:read',
    'users:write',
    'users:delete',
    'users:ban',
    'users:suspend',
    'users:verify',
    'posts:read',
    'posts:delete',
    'reports:read',
    'reports:manage',
    'flags:read',
    'flags:write',
    'analytics:read',
    'logs:read',
    'admins:read',
    'admins:write',
  ],
  [AdminRole.ADMIN]: [
    'users:read',
    'users:write',
    'users:ban',
    'users:suspend',
    'users:verify',
    'posts:read',
    'posts:delete',
    'reports:read',
    'reports:manage',
    'flags:read',
    'flags:write',
    'analytics:read',
    'logs:read',
  ],
  [AdminRole.MODERATOR]: [
    'users:read',
    'users:suspend',
    'posts:read',
    'posts:delete',
    'reports:read',
    'reports:manage',
  ],
  [AdminRole.SUPPORT]: [
    'users:read',
    'reports:read',
  ],
  [AdminRole.ANALYST]: [
    'users:read',
    'analytics:read',
    'logs:read',
  ],
};
