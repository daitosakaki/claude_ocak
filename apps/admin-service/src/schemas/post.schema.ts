import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

/**
 * Post türleri
 */
export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  POLL = 'poll',
}

/**
 * Post durumları
 */
export enum PostStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  HIDDEN = 'hidden',
}

/**
 * Post görünürlüğü
 */
export enum PostVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  FOLLOWERS = 'followers',
}

/**
 * Post şeması
 * 
 * Bu şema admin-service tarafından moderasyon amaçlı kullanılır.
 * Ana post yönetimi post-service tarafından yapılır.
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
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  authorId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(PostType),
    required: true,
  })
  type: PostType;

  @Prop({
    type: {
      text: { type: String, maxlength: 2000 },
      media: [{
        type: { type: String, enum: ['image', 'video'] },
        url: String,
        thumbnailUrl: String,
        width: Number,
        height: Number,
        duration: Number,
        blurhash: String,
      }],
      poll: {
        question: { type: String, maxlength: 200 },
        options: [{
          id: String,
          text: { type: String, maxlength: 100 },
          votesCount: { type: Number, default: 0 },
        }],
        totalVotes: { type: Number, default: 0 },
        endsAt: Date,
        allowMultiple: { type: Boolean, default: false },
      },
    },
  })
  content: {
    text?: string;
    media?: Array<{
      type: string;
      url: string;
      thumbnailUrl?: string;
      width?: number;
      height?: number;
      duration?: number;
      blurhash?: string;
    }>;
    poll?: {
      question: string;
      options: Array<{
        id: string;
        text: string;
        votesCount: number;
      }>;
      totalVotes: number;
      endsAt: Date;
      allowMultiple: boolean;
    };
  };

  @Prop({
    type: String,
    enum: Object.values(PostVisibility),
    default: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  @Prop({
    type: {
      likesCount: { type: Number, default: 0 },
      dislikesCount: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
      repostsCount: { type: Number, default: 0 },
      quotesCount: { type: Number, default: 0 },
      viewsCount: { type: Number, default: 0 },
      bookmarksCount: { type: Number, default: 0 },
    },
    default: {},
  })
  stats: {
    likesCount: number;
    dislikesCount: number;
    commentsCount: number;
    repostsCount: number;
    quotesCount: number;
    viewsCount: number;
    bookmarksCount: number;
  };

  @Prop({
    type: {
      isRepost: { type: Boolean, default: false },
      originalPostId: { type: Types.ObjectId, ref: 'Post', default: null },
      originalAuthorId: { type: Types.ObjectId, ref: 'User', default: null },
      isQuote: { type: Boolean, default: false },
    },
    default: { isRepost: false },
  })
  repost: {
    isRepost: boolean;
    originalPostId?: Types.ObjectId;
    originalAuthorId?: Types.ObjectId;
    isQuote?: boolean;
  };

  @Prop({ type: [String], default: [] })
  hashtags: string[];

  @Prop({ type: [Types.ObjectId], default: [] })
  mentions: Types.ObjectId[];

  @Prop({
    type: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number],
      name: String,
    },
    default: null,
  })
  location: {
    type: string;
    coordinates: number[];
    name?: string;
  };

  @Prop({ type: Boolean, default: false })
  isPinned: boolean;

  @Prop({ type: Boolean, default: false })
  commentsDisabled: boolean;

  @Prop({
    type: String,
    enum: Object.values(PostStatus),
    default: PostStatus.ACTIVE,
    index: true,
  })
  status: PostStatus;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// İndeksler
PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ authorId: 1, isPinned: -1, createdAt: -1 });
PostSchema.index({ hashtags: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ status: 1, visibility: 1, createdAt: -1 });
PostSchema.index({ 'stats.likesCount': -1, createdAt: -1 });
PostSchema.index({ location: '2dsphere' });
PostSchema.index({ 'content.text': 'text' });
