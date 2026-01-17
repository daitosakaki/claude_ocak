import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';

// Schemas
import { Listing, ListingSchema } from './schemas/listing.schema';
import { ListingCategory, ListingCategorySchema } from './schemas/listing-category.schema';
import { ListingFavorite, ListingFavoriteSchema } from './schemas/listing-favorite.schema';
import { ListingSettings, ListingSettingsSchema } from './schemas/listing-settings.schema';

// Services
import { ListingCrudService } from './services/listing-crud.service';
import { CategoryService } from './services/category.service';
import { SearchService } from './services/search.service';
import { FavoriteService } from './services/favorite.service';
import { PromotionService } from './services/promotion.service';

// Events
import { ListingPublisher } from './events/listing.publisher';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Listing.name, schema: ListingSchema },
      { name: ListingCategory.name, schema: ListingCategorySchema },
      { name: ListingFavorite.name, schema: ListingFavoriteSchema },
      { name: ListingSettings.name, schema: ListingSettingsSchema },
    ]),
  ],
  controllers: [ListingController],
  providers: [
    ListingService,
    ListingCrudService,
    CategoryService,
    SearchService,
    FavoriteService,
    PromotionService,
    ListingPublisher,
  ],
  exports: [ListingService],
})
export class ListingModule {}
