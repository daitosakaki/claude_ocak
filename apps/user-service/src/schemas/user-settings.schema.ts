import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserSettingsDocument = UserSettings & Document;

// Privacy subdocument
@Schema({ _id: false })
export class PrivacySettings {
  @Prop({ enum: ['everyone', 'followers', 'none'], default: 'everyone' })
  whoCanDM: string;

  @Prop({ enum: ['everyone', 'followers', 'none'], default: 'everyone' })
  whoCanTag: string;

  @Prop({ enum: ['everyone', 'followers', 'none'], default: 'everyone' })
  whoCanSeeFollowers: string;

  @Prop({ default: false })
  hideFromSearch: boolean;

  @Prop({ default: false })
  hideFromContacts: boolean;

  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop({ select: false })
  twoFactorSecret?: string;
}

// Content subdocument
@Schema({ _id: false })
export class ContentSettings {
  @Prop({ default: true })
  sensitiveContentFilter: boolean;

  @Prop({ type: [String], default: [] })
  mutedWords: string[];

  @Prop({ type: [String], default: ['tr'] })
  contentLanguages: string[];

  @Prop({ enum: ['always', 'wifi', 'never'], default: 'wifi' })
  autoPlayVideos: string;
}

// Display subdocument
@Schema({ _id: false })
export class DisplaySettings {
  @Prop({ enum: ['light', 'dark', 'system'], default: 'system' })
  theme: string;

  @Prop({ default: 'tr' })
  language: string;

  @Prop({ default: false })
  dataSaver: boolean;

  @Prop({ default: false })
  reduceMotion: boolean;

  @Prop({ default: true })
  hapticFeedback: boolean;
}

// Location subdocument
@Schema({ _id: false })
export class LocationSettings {
  @Prop({ enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number] }) // [longitude, latitude]
  coordinates?: number[];

  @Prop()
  city?: string;

  @Prop()
  country?: string;

  @Prop()
  updatedAt?: Date;
}

@Schema({
  collection: 'user_settings',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.privacy?.twoFactorSecret;
      return ret;
    },
  },
})
export class UserSettings {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: PrivacySettings, default: {} })
  privacy: PrivacySettings;

  @Prop({ type: ContentSettings, default: {} })
  content: ContentSettings;

  @Prop({ type: DisplaySettings, default: {} })
  display: DisplaySettings;

  @Prop({ type: LocationSettings, default: {} })
  location: LocationSettings;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettings);

// Indexes
UserSettingsSchema.index({ userId: 1 }, { unique: true });
