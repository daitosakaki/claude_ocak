import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ListingFavoriteDocument = ListingFavorite & Document;

@Schema({
  collection: 'listing_favorites',
  timestamps: { createdAt: true, updatedAt: false },
})
export class ListingFavorite {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Listing', required: true, index: true })
  listingId: Types.ObjectId;

  @Prop()
  createdAt: Date;
}

export const ListingFavoriteSchema = SchemaFactory.createForClass(ListingFavorite);

// ==================== İndeksler ====================

// Benzersiz favori (kullanıcı + ilan)
ListingFavoriteSchema.index({ userId: 1, listingId: 1 }, { unique: true });

// Kullanıcının favorileri (tarih sıralı)
ListingFavoriteSchema.index({ userId: 1, createdAt: -1 });

// İlanın favori sayısı için
ListingFavoriteSchema.index({ listingId: 1 });
