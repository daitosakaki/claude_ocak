import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ListingCategoryDocument = ListingCategory & Document;

// ==================== Alt şema: Kategori özellik tanımı ====================

@Schema({ _id: false })
export class CategoryAttribute {
  @Prop({ required: true })
  key: string;

  @Prop({ type: Object })
  label: {
    tr: string;
    en: string;
  };

  @Prop({ enum: ['text', 'number', 'select', 'multiselect', 'boolean'], required: true })
  type: string;

  @Prop({ type: [String] })
  options: string[];

  @Prop({ default: false })
  required: boolean;

  @Prop({ default: false })
  filterable: boolean;

  @Prop({ default: 0 })
  order: number;
}

// ==================== Ana şema ====================

@Schema({
  collection: 'listing_categories',
  timestamps: true,
})
export class ListingCategory {
  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: Object, required: true })
  name: {
    tr: string;
    en: string;
  };

  @Prop({ type: Types.ObjectId, ref: 'ListingCategory', default: null })
  parentId: Types.ObjectId;

  @Prop()
  path: string;

  @Prop({ min: 0, max: 3 })
  level: number;

  @Prop()
  icon: string;

  @Prop({ default: 0 })
  order: number;

  // Bu kategori için gerekli alanlar
  @Prop({ type: [CategoryAttribute], default: [] })
  attributes: CategoryAttribute[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  listingsCount: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ListingCategorySchema = SchemaFactory.createForClass(ListingCategory);

// ==================== İndeksler ====================

ListingCategorySchema.index({ slug: 1 }, { unique: true });
ListingCategorySchema.index({ parentId: 1, order: 1 });
ListingCategorySchema.index({ path: 1 });
ListingCategorySchema.index({ isActive: 1 });
