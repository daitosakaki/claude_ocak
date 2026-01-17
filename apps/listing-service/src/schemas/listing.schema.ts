import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ListingDocument = Listing & Document;

// ==================== Alt şemalar ====================

@Schema({ _id: false })
export class Category {
  @Prop({ required: true })
  main: string;

  @Prop()
  sub: string;

  @Prop({ required: true })
  path: string;
}

@Schema({ _id: false })
export class Price {
  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'TRY' })
  currency: string;

  @Prop({ default: false })
  isNegotiable: boolean;

  @Prop({ enum: ['fixed', 'negotiable', 'free', 'contact'], default: 'fixed' })
  priceType: string;
}

@Schema({ _id: false })
export class MediaItem {
  @Prop({ enum: ['image', 'video'], required: true })
  type: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  thumbnailUrl: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: false })
  isMain: boolean;
}

@Schema({ _id: false })
export class Location {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number] })
  coordinates: number[];

  @Prop({ required: true })
  city: string;

  @Prop()
  district: string;

  @Prop()
  neighborhood: string;
}

@Schema({ _id: false })
export class Contact {
  @Prop({ default: true })
  showPhone: boolean;

  @Prop()
  phone: string;

  @Prop({ default: false })
  whatsapp: boolean;
}

@Schema({ _id: false })
export class Stats {
  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ default: 0 })
  favoritesCount: number;

  @Prop({ default: 0 })
  messagesCount: number;
}

@Schema({ _id: false })
export class Promotion {
  @Prop({ default: false })
  isPromoted: boolean;

  @Prop()
  promotedUntil: Date;

  @Prop({ enum: ['featured', 'urgent', 'top'] })
  promotionType: string;
}

// ==================== Ana şema ====================

@Schema({
  collection: 'listings',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Listing {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  sellerId: Types.ObjectId;

  // Kategori
  @Prop({ type: Category, required: true })
  category: Category;

  // İçerik
  @Prop({ required: true, maxlength: 100 })
  title: string;

  @Prop({ required: true, maxlength: 5000 })
  description: string;

  // Fiyat
  @Prop({ type: Price, required: true })
  price: Price;

  // Medya
  @Prop({ type: [MediaItem], default: [] })
  media: MediaItem[];

  // Konum
  @Prop({ type: Location, required: true })
  location: Location;

  // Dinamik özellikler (kategori bazlı)
  @Prop({ type: Map, of: Object })
  attributes: Map<string, unknown>;

  // İletişim
  @Prop({ type: Contact })
  contact: Contact;

  // İstatistikler
  @Prop({ type: Stats, default: () => ({}) })
  stats: Stats;

  // Promosyon
  @Prop({ type: Promotion })
  promotion: Promotion;

  // Durum
  @Prop({
    type: String,
    enum: ['active', 'sold', 'expired', 'deleted', 'hidden'],
    default: 'active',
    index: true,
  })
  status: string;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  moderationStatus: string;

  // Tarihler
  @Prop({ type: Date, index: true })
  expiresAt: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);

// ==================== İndeksler ====================

// Kategori + durum + tarih (kategori listesi)
ListingSchema.index({ 'category.path': 1, status: 1, createdAt: -1 });

// Satıcı + durum + tarih (satıcı ilanları)
ListingSchema.index({ sellerId: 1, status: 1, createdAt: -1 });

// Konum bazlı arama (geospatial)
ListingSchema.index({ location: '2dsphere' });

// Promosyon sıralaması
ListingSchema.index({ status: 1, 'promotion.isPromoted': -1, createdAt: -1 });

// Fiyat filtresi
ListingSchema.index({ 'price.amount': 1 });

// Full-text arama
ListingSchema.index({ title: 'text', description: 'text' });

// Expire TTL check (opsiyonel - sadece monitoring için)
ListingSchema.index({ expiresAt: 1 });
