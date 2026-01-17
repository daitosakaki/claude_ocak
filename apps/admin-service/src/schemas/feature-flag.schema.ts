import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeatureFlagDocument = FeatureFlag & Document;

/**
 * Feature flag kategorileri
 */
export enum FeatureFlagCategory {
  MESSAGING = 'messaging',
  SOCIAL = 'social',
  DATING = 'dating',
  LISTINGS = 'listings',
  PROFILE = 'profile',
  NOTIFICATIONS = 'notifications',
  PRIVACY = 'privacy',
  PREMIUM = 'premium',
  SYSTEM = 'system',
}

/**
 * Feature flag şeması
 */
@Schema({
  collection: 'feature_flags',
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
export class FeatureFlag {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z][a-z0-9_]*$/,
  })
  key: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  })
  name: string;

  @Prop({
    type: String,
    maxlength: 500,
    default: null,
  })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(FeatureFlagCategory),
    required: true,
    index: true,
  })
  category: FeatureFlagCategory;

  @Prop({
    type: Boolean,
    default: false,
    index: true,
  })
  enabled: boolean;

  @Prop({
    type: {
      percentage: { type: Number, min: 0, max: 100, default: 100 },
      userIds: { type: [Types.ObjectId], default: [] },
    },
    default: { percentage: 100, userIds: [] },
  })
  rollout: {
    percentage: number;
    userIds: Types.ObjectId[];
  };

  @Prop({
    type: {
      free: { type: Boolean, default: true },
      premium: { type: Boolean, default: true },
      business: { type: Boolean, default: true },
    },
    default: { free: true, premium: true, business: true },
  })
  permissions: {
    free: boolean;
    premium: boolean;
    business: boolean;
  };

  @Prop({
    type: {
      hasUserSetting: { type: Boolean, default: false },
      settingKey: { type: String, default: null },
      settingLabel: { type: Object, default: null }, // { tr: '...', en: '...' }
      defaultValue: { type: Boolean, default: true },
    },
    default: { hasUserSetting: false },
  })
  userSetting: {
    hasUserSetting: boolean;
    settingKey?: string;
    settingLabel?: Record<string, string>;
    defaultValue?: boolean;
  };

  @Prop({
    type: [String],
    default: ['*'], // * = tüm bölgeler
  })
  regions: string[];

  @Prop({
    type: [String],
    default: ['ios', 'android', 'web'],
  })
  platforms: string[];

  @Prop({
    type: Types.ObjectId,
    ref: 'AdminUser',
    default: null,
  })
  updatedBy: Types.ObjectId;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const FeatureFlagSchema = SchemaFactory.createForClass(FeatureFlag);

// İndeksler
FeatureFlagSchema.index({ key: 1 }, { unique: true });
FeatureFlagSchema.index({ category: 1 });
FeatureFlagSchema.index({ enabled: 1 });
