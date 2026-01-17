import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ListingFavorite, ListingFavoriteDocument } from '../schemas/listing-favorite.schema';
import { Listing, ListingDocument } from '../schemas/listing.schema';
import { ListingQueryDto } from '../dto/listing-query.dto';
import { PaginatedListingResponseDto, ListingResponseDto } from '../dto/listing-response.dto';
import { ListingService } from '../listing.service';

/**
 * Favori yönetim servisi
 */
@Injectable()
export class FavoriteService {
  private readonly logger = new Logger(FavoriteService.name);

  constructor(
    @InjectModel(ListingFavorite.name)
    private readonly favoriteModel: Model<ListingFavoriteDocument>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    private readonly listingService: ListingService,
  ) {}

  /**
   * İlanı favorilere ekle
   */
  async add(userId: string, listingId: string): Promise<{ success: boolean }> {
    // İlan var mı kontrol et
    const listing = await this.listingModel.findById(listingId).exec();
    if (!listing) {
      throw new NotFoundException('İlan bulunamadı');
    }

    // Zaten favorilerde mi kontrol et
    const existing = await this.favoriteModel.findOne({
      userId: new Types.ObjectId(userId),
      listingId: new Types.ObjectId(listingId),
    });

    if (existing) {
      return { success: true }; // Zaten favorilerde
    }

    // Favoriye ekle
    await this.favoriteModel.create({
      userId: new Types.ObjectId(userId),
      listingId: new Types.ObjectId(listingId),
    });

    // İlan favori sayısını artır
    await this.listingService.updateFavoriteCount(listingId, 1);

    this.logger.log(`Favorilere eklendi: user=${userId}, listing=${listingId}`);

    return { success: true };
  }

  /**
   * İlanı favorilerden kaldır
   */
  async remove(userId: string, listingId: string): Promise<void> {
    const result = await this.favoriteModel.deleteOne({
      userId: new Types.ObjectId(userId),
      listingId: new Types.ObjectId(listingId),
    });

    if (result.deletedCount > 0) {
      // İlan favori sayısını azalt
      await this.listingService.updateFavoriteCount(listingId, -1);

      this.logger.log(`Favorilerden kaldırıldı: user=${userId}, listing=${listingId}`);
    }
  }

  /**
   * Kullanıcının favori ilanlarını getir
   */
  async getUserFavorites(
    userId: string,
    query: ListingQueryDto,
  ): Promise<PaginatedListingResponseDto> {
    const { cursor, limit = 20 } = query;

    const matchStage: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (cursor) {
      matchStage._id = { $lt: new Types.ObjectId(cursor) };
    }

    // Aggregation ile favori + ilan bilgisini birleştir
    const favorites = await this.favoriteModel.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      { $limit: limit + 1 },
      {
        $lookup: {
          from: 'listings',
          localField: 'listingId',
          foreignField: '_id',
          as: 'listing',
        },
      },
      { $unwind: '$listing' },
      {
        $match: {
          'listing.status': { $in: ['active', 'sold'] },
        },
      },
    ]);

    const hasMore = favorites.length > limit;
    if (hasMore) {
      favorites.pop();
    }

    const listings = favorites.map((f) => this.toResponseDto(f.listing));

    return {
      success: true,
      data: listings,
      pagination: {
        hasMore,
        nextCursor: hasMore ? favorites[favorites.length - 1]._id.toString() : undefined,
        limit,
      },
    };
  }

  /**
   * İlan favorilerde mi kontrol et
   */
  async isFavorited(userId: string, listingId: string): Promise<boolean> {
    const favorite = await this.favoriteModel.findOne({
      userId: new Types.ObjectId(userId),
      listingId: new Types.ObjectId(listingId),
    });

    return !!favorite;
  }

  /**
   * Birden fazla ilanın favori durumunu kontrol et
   */
  async checkFavoriteStatus(
    userId: string,
    listingIds: string[],
  ): Promise<Map<string, boolean>> {
    const favorites = await this.favoriteModel.find({
      userId: new Types.ObjectId(userId),
      listingId: { $in: listingIds.map((id) => new Types.ObjectId(id)) },
    });

    const favoriteMap = new Map<string, boolean>();
    listingIds.forEach((id) => favoriteMap.set(id, false));
    favorites.forEach((f) => favoriteMap.set(f.listingId.toString(), true));

    return favoriteMap;
  }

  /**
   * Kullanıcının toplam favori sayısı
   */
  async getUserFavoriteCount(userId: string): Promise<number> {
    return this.favoriteModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });
  }

  /**
   * Document'ı response DTO'ya dönüştür
   */
  private toResponseDto(listing: ListingDocument): ListingResponseDto {
    return {
      id: listing._id.toString(),
      sellerId: listing.sellerId.toString(),
      title: listing.title,
      description: listing.description,
      category: listing.category,
      price: listing.price,
      media: listing.media,
      location: listing.location,
      attributes: listing.attributes as unknown as Record<string, unknown>,
      contact: listing.contact,
      stats: listing.stats,
      promotion: listing.promotion,
      status: listing.status,
      expiresAt: listing.expiresAt,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }
}
