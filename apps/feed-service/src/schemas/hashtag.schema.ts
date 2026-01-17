import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Hashtag Stats alt şeması
 */
@Schema({ _id: false })
export class HashtagStats {
  @Prop({ default: 0 })
  postsCount: number;

  @Prop({ default: 0 })
  postsToday: number;

  @Prop({ default: 0 })
  postsThisWeek: number;
}

/**
 * Hashtag Schema
 * Trending hesaplama için hashtag istatistikleri
 */
@Schema({
  collection: 'hashtags',
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
export class Hashtag {
  @Prop({ required: true, unique: true, lowercase: true, index: true })
  tag: string;

  @Prop({ type: HashtagStats, default: () => ({}) })
  stats: HashtagStats;

  @Prop()
  lastUsedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type HashtagDocument = Hashtag & Document;
export const HashtagSchema = SchemaFactory.createForClass(Hashtag);

// Indexes
HashtagSchema.index({ 'stats.postsToday': -1 });
HashtagSchema.index({ 'stats.postsThisWeek': -1 });
HashtagSchema.index({ lastUsedAt: -1 });
