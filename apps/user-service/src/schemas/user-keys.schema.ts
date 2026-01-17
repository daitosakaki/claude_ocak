import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserKeysDocument = UserKeys & Document;

@Schema({
  collection: 'user_keys',
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
export class UserKeys {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  publicKey: string; // Base64 encoded X25519 public key

  @Prop({ required: true })
  deviceId: string;

  @Prop()
  deviceName?: string; // "iPhone 15", "Chrome - Windows"

  @Prop({ enum: ['ios', 'android', 'web'] })
  platform?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastUsedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const UserKeysSchema = SchemaFactory.createForClass(UserKeys);

// Indexes
UserKeysSchema.index({ userId: 1 });
UserKeysSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
UserKeysSchema.index({ userId: 1, isActive: 1 });
