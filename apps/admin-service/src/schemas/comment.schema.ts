import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

/**
 * Yorum durumları
 */
export enum CommentStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  HIDDEN = 'hidden',
}

/**
 * Yorum şeması
 * 
 * Bu şema admin-service tarafından moderasyon amaçlı kullanılır.
 * Ana yorum yönetimi interaction-service tarafından yapılır.
 */
@Schema({
  collection: 'comments',
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
export class Comment {
  @Prop({
    type: Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true,
  })
  postId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  authorId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true,
  })
  parentId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    maxlength: 500,
  })
  content: string;

  @Prop({
    type: [Types.ObjectId],
    default: [],
  })
  mentions: Types.ObjectId[];

  @Prop({
    type: {
      likesCount: { type: Number, default: 0 },
      repliesCount: { type: Number, default: 0 },
    },
    default: { likesCount: 0, repliesCount: 0 },
  })
  stats: {
    likesCount: number;
    repliesCount: number;
  };

  @Prop({
    type: String,
    enum: Object.values(CommentStatus),
    default: CommentStatus.ACTIVE,
    index: true,
  })
  status: CommentStatus;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// İndeksler
CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ postId: 1, parentId: 1, createdAt: 1 });
CommentSchema.index({ authorId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1 });
