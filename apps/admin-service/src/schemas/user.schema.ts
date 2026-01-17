import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

/**
 * Kullanıcı durumları
 */
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  DELETED = 'deleted',
}

/**
 * Abonelik planları
 */
export enum SubscriptionPlan {
  FREE = 'free',
  PREMIUM = 'premium',
  BUSINESS = 'business',
}

/**
 * Kullanıcı şeması
 * 
 * Bu şema admin-service tarafından sadece okuma amaçlı kullanılır.
 * Ana kullanıcı yönetimi user-service tarafından yapılır.
 */
@Schema({
  collection: 'users',
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
export class User {
  // Identity
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-z0-9_]+$/,
  })
  username: string;

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
    unique: true,
    sparse: true,
    default: null,
  })
  phone: string;

  @Prop({
    type: String,
    required: true,
    select: false,
  })
  passwordHash: string;

  // Profile
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  })
  displayName: string;

  @Prop({ type: String, default: null })
  avatar: string;

  @Prop({ type: String, default: null })
  coverImage: string;

  @Prop({
    type: String,
    maxlength: 500,
    default: null,
  })
  bio: string;

  @Prop({ type: String, default: null })
  website: string;

  @Prop({
    type: Date,
    select: false,
    default: null,
  })
  birthDate: Date;

  @Prop({
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: null,
  })
  gender: string;

  // Flags
  @Prop({ type: Boolean, default: false })
  isPrivate: boolean;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  // Stats (denormalized)
  @Prop({
    type: {
      postsCount: { type: Number, default: 0 },
      followersCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      likesCount: { type: Number, default: 0 },
    },
    default: {
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      likesCount: 0,
    },
  })
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    likesCount: number;
  };

  // Subscription
  @Prop({
    type: {
      plan: {
        type: String,
        enum: Object.values(SubscriptionPlan),
        default: SubscriptionPlan.FREE,
      },
      expiresAt: { type: Date, default: null },
      subscribedAt: { type: Date, default: null },
    },
    default: { plan: SubscriptionPlan.FREE },
  })
  subscription: {
    plan: SubscriptionPlan;
    expiresAt?: Date;
    subscribedAt?: Date;
  };

  // Status
  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
    index: true,
  })
  status: UserStatus;

  @Prop({ type: String, default: null })
  banReason: string;

  @Prop({ type: Date, default: null })
  suspendedUntil: Date;

  @Prop({ type: Date, default: null })
  lastSeenAt: Date;

  // OAuth
  @Prop({
    type: {
      google: { type: String, default: null, sparse: true },
      apple: { type: String, default: null, sparse: true },
    },
    default: {},
  })
  oauth: {
    google?: string;
    apple?: string;
  };

  // Verification
  @Prop({
    type: {
      email: { type: Boolean, default: false },
      phone: { type: Boolean, default: false },
      identity: { type: Boolean, default: false },
    },
    default: { email: false, phone: false, identity: false },
  })
  verification: {
    email: boolean;
    phone: boolean;
    identity: boolean;
  };

  // Modules
  @Prop({
    type: {
      dating: { type: Boolean, default: false },
      listings: { type: Boolean, default: false },
    },
    default: { dating: false, listings: false },
  })
  modules: {
    dating: boolean;
    listings: boolean;
  };

  // FCM Tokens
  @Prop({
    type: [{
      token: String,
      deviceId: String,
      platform: { type: String, enum: ['ios', 'android', 'web'] },
      createdAt: { type: Date, default: Date.now },
    }],
    default: [],
  })
  fcmTokens: Array<{
    token: string;
    deviceId: string;
    platform: string;
    createdAt: Date;
  }>;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// İndeksler
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ 'oauth.google': 1 }, { sparse: true });
UserSchema.index({ 'oauth.apple': 1 }, { sparse: true });
UserSchema.index({ status: 1, createdAt: -1 });
UserSchema.index({ displayName: 'text', username: 'text' });
