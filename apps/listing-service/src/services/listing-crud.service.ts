import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Listing, ListingDocument } from '../schemas/listing.schema';

/**
 * İlan CRUD yardımcı servisi
 * ListingService'e ek fonksiyonlar sağlar
 */
@Injectable()
export class ListingCrudService {
  private readonly logger = new Logger(ListingCrudService.name);

  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
  ) {}

  /**
   * İlanı ID ile bul (raw document)
   */
  async findById(id: string): Promise<ListingDocument | null> {
    return this.listingModel.findById(id).exec();
  }

  /**
   * Kullanıcının aktif ilan sayısı
   */
  async countUserActiveListings(userId: string): Promise<number> {
    return this.listingModel.countDocuments({
      sellerId: new Types.ObjectId(userId),
      status: 'active',
    });
  }

  /**
   * Süresi dolan ilanları bul
   */
  async findExpiredListings(limit = 100): Promise<ListingDocument[]> {
    return this.listingModel
      .find({
        status: 'active',
        expiresAt: { $lt: new Date() },
      })
      .limit(limit)
      .exec();
  }

  /**
   * Süresi dolan ilanları expire et (batch)
   */
  async expireListings(listingIds: string[]): Promise<void> {
    await this.listingModel.updateMany(
      { _id: { $in: listingIds.map((id) => new Types.ObjectId(id)) } },
      { $set: { status: 'expired' } },
    );

    this.logger.log(`${listingIds.length} ilan süresi doldu olarak işaretlendi`);
  }

  /**
   * İlan view count artır (bulk)
   */
  async incrementViewCount(listingId: string): Promise<void> {
    await this.listingModel.updateOne(
      { _id: new Types.ObjectId(listingId) },
      { $inc: { 'stats.viewsCount': 1 } },
    );
  }

  /**
   * İstatistik güncelle
   */
  async updateStats(
    listingId: string,
    stats: Partial<{ viewsCount: number; favoritesCount: number; messagesCount: number }>,
  ): Promise<void> {
    const update: Record<string, number> = {};

    if (stats.viewsCount !== undefined) {
      update['stats.viewsCount'] = stats.viewsCount;
    }
    if (stats.favoritesCount !== undefined) {
      update['stats.favoritesCount'] = stats.favoritesCount;
    }
    if (stats.messagesCount !== undefined) {
      update['stats.messagesCount'] = stats.messagesCount;
    }

    await this.listingModel.updateOne(
      { _id: new Types.ObjectId(listingId) },
      { $inc: update },
    );
  }

  /**
   * Benzer ilanları bul (aynı kategori, yakın fiyat)
   */
  async findSimilar(listing: ListingDocument, limit = 5): Promise<ListingDocument[]> {
    const priceRange = {
      min: listing.price.amount * 0.7,
      max: listing.price.amount * 1.3,
    };

    return this.listingModel
      .find({
        _id: { $ne: listing._id },
        'category.path': { $regex: `^${listing.category.main}` },
        status: 'active',
        moderationStatus: 'approved',
        'price.amount': { $gte: priceRange.min, $lte: priceRange.max },
      })
      .sort({ 'stats.viewsCount': -1 })
      .limit(limit)
      .exec();
  }
}
