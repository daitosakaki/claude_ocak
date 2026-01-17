import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Trend Stats alt şeması
 */
@Schema({ _id: false })
export class TrendStats {
  @Prop({ default: 0 })
  postsCount: number;

  @Prop({ default: 0 })
  interactionsCount: number;

  @Prop({ default: 0 })
  score: number;
}

/**
 * Trend Schema
 * Hesaplanmış trending konular
 */
@Schema({
  collection: 'trends',
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
export class Trend {
  @Prop({ required: true, enum: ['hashtag', 'topic'] })
  type: 'hashtag' | 'topic';

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ type: TrendStats, default: () => ({}) })
  stats: TrendStats;

  @Prop({ default: 'TR', index: true })
  region: string;

  @Prop({ required: true, enum: ['hourly', 'daily', 'weekly'], index: true })
  period: 'hourly' | 'daily' | 'weekly';

  @Prop({ required: true })
  rank: number;

  @Prop({ index: true })
  expiresAt: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type TrendDocument = Trend & Document;
export const TrendSchema = SchemaFactory.createForClass(Trend);

// Compound indexes
TrendSchema.index({ region: 1, period: 1, rank: 1 });
TrendSchema.index({ name: 1, region: 1, period: 1 }, { unique: true });
TrendSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
