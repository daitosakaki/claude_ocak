import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Follow Schema
 * Feed service sadece okuma yapar (following listesi için)
 */
@Schema({
  collection: 'follows',
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
export class Follow {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  followerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  followingId: Types.ObjectId;

  @Prop({ enum: ['active', 'pending'], default: 'active', index: true })
  status: 'active' | 'pending';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type FollowDocument = Follow & Document;
export const FollowSchema = SchemaFactory.createForClass(Follow);

// Compound indexes
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followerId: 1, status: 1 });
FollowSchema.index({ followingId: 1, status: 1 });
FollowSchema.index({ followingId: 1, status: 1, createdAt: -1 });
