import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ListingSettingsDocument = ListingSettings & Document;

// ==================== Alt şemalar ====================

@Schema({ _id: false })
export class SellerProfile {
  @Prop()
  storeName: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  isVerified: boolean;
}

@Schema({ _id: false })
export class ContactSettings {
  @Prop({ default: true })
  showPhone: boolean;

  @Prop()
  alternativePhone: string;

  @Prop({ default: false })
  whatsappEnabled: boolean;
}

@Schema({ _id: false })
export class DefaultLocation {
  @Prop({ type: [Number] })
  coordinates: number[];

  @Prop()
  city: string;

  @Prop()
  district: string;
}

@Schema({ _id: false })
export class SavedSearch {
  @Prop()
  name: string;

  @Prop()
  query: string;

  @Prop({ type: Object })
  filters: Record<string, unknown>;

  @Prop({ default: true })
  notificationsEnabled: boolean;

  @Prop()
  createdAt: Date;
}

// ==================== Ana şema ====================

@Schema({
  collection: 'listing_settings',
  timestamps: true,
})
export class ListingSettings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: SellerProfile })
  sellerProfile: SellerProfile;

  @Prop({ type: ContactSettings })
  contact: ContactSettings;

  @Prop({ type: DefaultLocation })
  defaultLocation: DefaultLocation;

  @Prop({ type: [SavedSearch], default: [] })
  savedSearches: SavedSearch[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ListingSettingsSchema = SchemaFactory.createForClass(ListingSettings);

// ==================== İndeksler ====================

ListingSettingsSchema.index({ userId: 1 }, { unique: true });
