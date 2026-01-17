import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Listing, ListingDocument } from '../schemas/listing.schema';
import { ListingQueryDto } from '../dto/listing-query.dto';
import { PaginatedListingResponseDto, ListingResponseDto } from '../dto/listing-response.dto';

/**
 * İlan arama servisi
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
  ) {}

  /**
   * Full-text arama
   */
  async search(
    searchQuery: string,
    query: ListingQueryDto,
  ): Promise<PaginatedListingResponseDto> {
    const { cursor, limit = 20, city, district, minPrice, maxPrice, category } = query;

    // Filtre oluştur
    const filter: Record<string, unknown> = {
      $text: { $search: searchQuery },
      status: 'active',
      moderationStatus: 'approved',
    };

    if (category) {
      filter['category.path'] = { $regex: `^${category}` };
    }
    if (city) {
      filter['location.city'] = city;
    }
    if (district) {
      filter['location.district'] = district;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter['price.amount'] = {};
      if (minPrice !== undefined) {
        (filter['price.amount'] as Record<string, number>).$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        (filter['price.amount'] as Record<string, number>).$lte = maxPrice;
      }
    }

    if (cursor) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    // Arama yap (text score ile sırala)
    const listings = await this.listingModel
      .find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = listings.length > limit;
    if (hasMore) {
      listings.pop();
    }

    return {
      success: true,
      data: listings.map((l) => this.toResponseDto(l)),
      pagination: {
        hasMore,
        nextCursor: hasMore ? listings[listings.length - 1]._id.toString() : undefined,
        limit,
      },
    };
  }

  /**
   * Yakındaki ilanları bul (geospatial)
   */
  async searchNearby(
    lat: number,
    lng: number,
    maxDistanceKm: number,
    query: ListingQueryDto,
  ): Promise<PaginatedListingResponseDto> {
    const { cursor, limit = 20, category, minPrice, maxPrice } = query;

    const filter: Record<string, unknown> = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistanceKm * 1000, // metre
        },
      },
      status: 'active',
      moderationStatus: 'approved',
    };

    if (category) {
      filter['category.path'] = { $regex: `^${category}` };
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter['price.amount'] = {};
      if (minPrice !== undefined) {
        (filter['price.amount'] as Record<string, number>).$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        (filter['price.amount'] as Record<string, number>).$lte = maxPrice;
      }
    }

    if (cursor) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const listings = await this.listingModel.find(filter).limit(limit + 1).exec();

    const hasMore = listings.length > limit;
    if (hasMore) {
      listings.pop();
    }

    return {
      success: true,
      data: listings.map((l) => this.toResponseDto(l)),
      pagination: {
        hasMore,
        nextCursor: hasMore ? listings[listings.length - 1]._id.toString() : undefined,
        limit,
      },
    };
  }

  /**
   * Otomatik tamamlama önerileri
   */
  async suggest(searchQuery: string, limit = 10): Promise<SuggestionResult[]> {
    const results = await this.listingModel
      .aggregate([
        {
          $match: {
            status: 'active',
            moderationStatus: 'approved',
            title: { $regex: searchQuery, $options: 'i' },
          },
        },
        {
          $group: {
            _id: null,
            titles: { $addToSet: '$title' },
          },
        },
        {
          $project: {
            titles: { $slice: ['$titles', limit] },
          },
        },
      ])
      .exec();

    if (results.length === 0) {
      return [];
    }

    return results[0].titles.map((title: string) => ({
      text: title,
      type: 'listing',
    }));
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

// ==================== Tipler ====================

interface SuggestionResult {
  text: string;
  type: 'listing' | 'category' | 'brand';
}
