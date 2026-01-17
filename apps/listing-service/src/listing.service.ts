import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Listing, ListingDocument } from './schemas/listing.schema';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import { ListingResponseDto, PaginatedListingResponseDto } from './dto/listing-response.dto';
import { ListingPublisher } from './events/listing.publisher';

@Injectable()
export class ListingService {
  private readonly logger = new Logger(ListingService.name);

  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    private readonly listingPublisher: ListingPublisher,
  ) {}

  /**
   * Yeni ilan oluştur
   */
  async create(createListingDto: CreateListingDto, userId: string): Promise<ListingResponseDto> {
    this.logger.log(`Yeni ilan oluşturuluyor: ${userId}`);

    const listing = new this.listingModel({
      ...createListingDto,
      sellerId: new Types.ObjectId(userId),
      status: 'active',
      moderationStatus: 'pending',
      stats: {
        viewsCount: 0,
        favoritesCount: 0,
        messagesCount: 0,
      },
      // 30 gün sonra expire olacak
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const saved = await listing.save();

    // Event yayınla
    await this.listingPublisher.publishListingCreated(saved);

    return this.toResponseDto(saved);
  }

  /**
   * İlanları listele (filtreli)
   */
  async findAll(query: ListingQueryDto): Promise<PaginatedListingResponseDto> {
    const {
      cursor,
      limit = 20,
      category,
      city,
      district,
      minPrice,
      maxPrice,
      condition,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Filtre oluştur
    const filter: Record<string, unknown> = {
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
    if (condition) {
      filter['attributes.condition'] = condition;
    }

    // Cursor-based pagination
    if (cursor) {
      const cursorDoc = await this.listingModel.findById(cursor).exec();
      if (cursorDoc) {
        filter._id = { $lt: cursorDoc._id };
      }
    }

    // Sıralama
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const listings = await this.listingModel
      .find(filter)
      .sort(sort)
      .limit(limit + 1)
      .exec();

    const hasMore = listings.length > limit;
    if (hasMore) {
      listings.pop();
    }

    const nextCursor = hasMore && listings.length > 0 
      ? listings[listings.length - 1]._id.toString() 
      : undefined;

    return {
      success: true,
      data: listings.map((l) => this.toResponseDto(l)),
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    };
  }

  /**
   * Kullanıcının ilanları
   */
  async findByUser(userId: string, query: ListingQueryDto): Promise<PaginatedListingResponseDto> {
    const { cursor, limit = 20 } = query;

    const filter: Record<string, unknown> = {
      sellerId: new Types.ObjectId(userId),
    };

    if (cursor) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const listings = await this.listingModel
      .find(filter)
      .sort({ createdAt: -1 })
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
   * İlan detayı
   */
  async findOne(id: string): Promise<ListingResponseDto> {
    const listing = await this.listingModel.findById(id).exec();

    if (!listing) {
      throw new NotFoundException('İlan bulunamadı');
    }

    // View count artır
    await this.listingModel.updateOne(
      { _id: listing._id },
      { $inc: { 'stats.viewsCount': 1 } },
    );

    return this.toResponseDto(listing);
  }

  /**
   * İlan güncelle
   */
  async update(
    id: string,
    updateListingDto: UpdateListingDto,
    userId: string,
  ): Promise<ListingResponseDto> {
    const listing = await this.listingModel.findById(id).exec();

    if (!listing) {
      throw new NotFoundException('İlan bulunamadı');
    }

    if (listing.sellerId.toString() !== userId) {
      throw new ForbiddenException('Bu ilanı düzenleme yetkiniz yok');
    }

    Object.assign(listing, updateListingDto);
    listing.updatedAt = new Date();

    const updated = await listing.save();

    // Event yayınla
    await this.listingPublisher.publishListingUpdated(updated);

    return this.toResponseDto(updated);
  }

  /**
   * İlan sil
   */
  async remove(id: string, userId: string): Promise<void> {
    const listing = await this.listingModel.findById(id).exec();

    if (!listing) {
      throw new NotFoundException('İlan bulunamadı');
    }

    if (listing.sellerId.toString() !== userId) {
      throw new ForbiddenException('Bu ilanı silme yetkiniz yok');
    }

    listing.status = 'deleted';
    await listing.save();

    // Event yayınla
    await this.listingPublisher.publishListingDeleted(id, userId);

    this.logger.log(`İlan silindi: ${id}`);
  }

  /**
   * İlanı satıldı olarak işaretle
   */
  async markAsSold(id: string, userId: string): Promise<ListingResponseDto> {
    const listing = await this.listingModel.findById(id).exec();

    if (!listing) {
      throw new NotFoundException('İlan bulunamadı');
    }

    if (listing.sellerId.toString() !== userId) {
      throw new ForbiddenException('Bu ilanı düzenleme yetkiniz yok');
    }

    listing.status = 'sold';
    listing.updatedAt = new Date();
    const updated = await listing.save();

    return this.toResponseDto(updated);
  }

  /**
   * İlanı tekrar aktifleştir
   */
  async reactivate(id: string, userId: string): Promise<ListingResponseDto> {
    const listing = await this.listingModel.findById(id).exec();

    if (!listing) {
      throw new NotFoundException('İlan bulunamadı');
    }

    if (listing.sellerId.toString() !== userId) {
      throw new ForbiddenException('Bu ilanı düzenleme yetkiniz yok');
    }

    listing.status = 'active';
    listing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    listing.updatedAt = new Date();
    const updated = await listing.save();

    return this.toResponseDto(updated);
  }

  /**
   * Favori sayısını artır/azalt
   */
  async updateFavoriteCount(listingId: string, increment: number): Promise<void> {
    await this.listingModel.updateOne(
      { _id: new Types.ObjectId(listingId) },
      { $inc: { 'stats.favoritesCount': increment } },
    );
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
      attributes: listing.attributes,
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
