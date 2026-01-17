import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FollowDocument = Follow & Document;

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
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  followerId: Types.ObjectId; // Takip eden

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  followingId: Types.ObjectId; // Takip edilen

  @Prop({
    enum: ['active', 'pending'], // pending = gizli hesap onay bekliyor
    default: 'active',
  })
  status: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

// Indexes
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followerId: 1, status: 1 }); // Takip ettiklerim
FollowSchema.index({ followingId: 1, status: 1 }); // Takipçilerim
FollowSchema.index({ followingId: 1, status: 1, createdAt: -1 }); // Yeni takipçiler
