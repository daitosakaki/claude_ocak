import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

// FCM Token subdocument
@Schema({ _id: false })
export class FcmToken {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  deviceId: string;

  @Prop({ enum: ['ios', 'android', 'web'], required: true })
  platform: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

// Stats subdocument
@Schema({ _id: false })
export class UserStats {
  @Prop({ default: 0 })
  postsCount: number;

  @Prop({ default: 0 })
  followersCount: number;

  @Prop({ default: 0 })
  followingCount: number;

  @Prop({ default: 0 })
  likesCount: number;
}

// Subscription subdocument
@Schema({ _id: false })
export class Subscription {
  @Prop({ enum: ['free', 'premium', 'business'], default: 'free' })
  plan: string;

  @Prop()
  expiresAt?: Date;

  @Prop()
  subscribedAt?: Date;
}

// Verification subdocument
@Schema({ _id: false })
export class Verification {
  @Prop({ default: false })
  email: boolean;

  @Prop({ default: false })
  phone: boolean;

  @Prop({ default: false })
  identity: boolean;
}

// OAuth subdocument
@Schema({ _id: false })
export class OAuth {
  @Prop()
  google?: string;

  @Prop()
  apple?: string;
}

// Modules subdocument
@Schema({ _id: false })
export class Modules {
  @Prop({ default: false })
  dating: boolean;

  @Prop({ default: false })
  listings: boolean;
}

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
  _id: Types.ObjectId;

  // ========== IDENTITY ==========
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-z0-9_]+$/,
  })
  username: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
  })
  email: string;

  @Prop({
    unique: true,
    sparse: true, // null olabilir
  })
  phone?: string;

  @Prop({
    required: true,
    select: false, // Varsayılan olarak dönme
  })
  passwordHash: string;

  // ========== PROFILE (Public) ==========
  @Prop({ required: true, maxlength: 50 })
  displayName: string;

  @Prop()
  avatar?: string;

  @Prop()
  coverImage?: string;

  @Prop({ maxlength: 500 })
  bio?: string;

  @Prop()
  website?: string;

  @Prop({ select: false })
  birthDate?: Date;

  @Prop({ enum: ['male', 'female', 'other', 'prefer_not_to_say'] })
  gender?: string;

  // ========== FLAGS ==========
  @Prop({ default: false })
  isPrivate: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  // ========== STATS (Denormalized) ==========
  @Prop({ type: UserStats, default: {} })
  stats: UserStats;

  // ========== SUBSCRIPTION ==========
  @Prop({ type: Subscription, default: {} })
  subscription: Subscription;

  // ========== STATUS ==========
  @Prop({
    enum: ['active', 'suspended', 'banned', 'deleted'],
    default: 'active',
  })
  status: string;

  @Prop()
  banReason?: string;

  @Prop()
  suspendedUntil?: Date;

  @Prop()
  lastSeenAt?: Date;

  // ========== AUTH ==========
  @Prop({ type: OAuth, default: {} })
  oauth: OAuth;

  // ========== VERIFICATION ==========
  @Prop({ type: Verification, default: {} })
  verification: Verification;

  // ========== DEVICES ==========
  @Prop({ type: [FcmToken], default: [] })
  fcmTokens: FcmToken[];

  // ========== MODULES ==========
  @Prop({ type: Modules, default: {} })
  modules: Modules;

  // ========== TIMESTAMPS ==========
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ 'oauth.google': 1 }, { sparse: true });
UserSchema.index({ 'oauth.apple': 1 }, { sparse: true });
UserSchema.index({ status: 1, createdAt: -1 });
UserSchema.index({ displayName: 'text', username: 'text' }); // Text search
