import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Media alt şeması
 */
@Schema({ _id: false })
export class Media {
  @Prop({ required: true, enum: ['image', 'video'] })
  type: 'image' | 'video';

  @Prop({ required: true })
  url: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop()
  duration?: number;

  @Prop()
  blurhash?: string;
}

/**
 * Poll option alt şeması
 */
@Schema({ _id: false })
export class PollOption {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, maxlength: 100 })
  text: string;

  @Prop({ default: 0 })
  votesCount: number;
}

/**
 * Poll alt şeması
 */
@Schema({ _id: false })
export class Poll {
  @Prop({ required: true, maxlength: 200 })
  question: string;

  @Prop({ type: [PollOption], required: true })
  options: PollOption[];

  @Prop({ default: 0 })
  totalVotes: number;

  @Prop()
  endsAt?: Date;

  @Prop({ default: false })
  allowMultiple: boolean;
}

/**
 * Content alt şeması
 */
@Schema({ _id: false })
export class PostContent {
  @Prop({ maxlength: 2000 })
  text?: string;

  @Prop({ type: [Media] })
  media?: Media[];

  @Prop({ type: Poll })
  poll?: Poll;
}

/**
 * Stats alt şeması
 */
@Schema({ _id: false })
export class PostStats {
  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  dislikesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ default: 0 })
  repostsCount: number;

  @Prop({ default: 0 })
  quotesCount: number;

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ default: 0 })
  bookmarksCount: number;
}

/**
 * Repost bilgisi alt şeması
 */
@Schema({ _id: false })
export class RepostInfo {
  @Prop({ default: false })
  isRepost: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Post' })
  originalPostId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  originalAuthorId?: Types.ObjectId;

  @Prop({ default: false })
  isQuote: boolean;
}

/**
 * Location alt şeması
 */
@Schema({ _id: false })
export class PostLocation {
  @Prop({ enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number] })
  coordinates: number[];

  @Prop()
  name?: string;
}

/**
 * Post Schema
 * Feed service sadece okuma yapar, bu şema post-service ile senkronize olmalı
 */
@Schema({
  collection: 'posts',
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
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, enum: ['text', 'image', 'video', 'poll'] })
  type: 'text' | 'image' | 'video' | 'poll';

  @Prop({ type: PostContent })
  content: PostContent;

  @Prop({ enum: ['public', 'private', 'followers'], default: 'public' })
  visibility: 'public' | 'private' | 'followers';

  @Prop({ type: PostStats, default: () => ({}) })
  stats: PostStats;

  @Prop({ type: RepostInfo })
  repost?: RepostInfo;

  @Prop({ type: [String], index: true })
  hashtags: string[];

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  mentions: Types.ObjectId[];

  @Prop({ type: PostLocation })
  location?: PostLocation;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ default: false })
  commentsDisabled: boolean;

  @Prop({ enum: ['active', 'deleted', 'hidden'], default: 'active', index: true })
  status: 'active' | 'deleted' | 'hidden';

  // Parent post (yanıt ise)
  @Prop({ type: Types.ObjectId, ref: 'Post' })
  parentId?: Types.ObjectId;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type PostDocument = Post & Document;
export const PostSchema = SchemaFactory.createForClass(Post);

// Compound indexes
PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ authorId: 1, isPinned: -1, createdAt: -1 });
PostSchema.index({ hashtags: 1, createdAt: -1 });
PostSchema.index({ status: 1, visibility: 1, createdAt: -1 });
PostSchema.index({ 'stats.likesCount': -1, createdAt: -1 });
PostSchema.index({ 'location.coordinates': '2dsphere' });

// Text index
PostSchema.index({ 'content.text': 'text' });
