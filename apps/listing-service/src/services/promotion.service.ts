import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Listing, ListingDocument } from '../schemas/listing.schema';

/**
 * Promosyon yönetim servisi
 * İlan öne çıkarma, acil badge, bump up işlemleri
 */
@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * İlanı öne çıkar (featured)
   */
  async promoteFeatured(
    listingId: string,
    userId: string,
    duration: '7d' | '14d' | '30d',
  ): Promise<PromotionResult> {
    const listing = await this.validateOwnership(listingId, userId);

    const prices = this.configService.get<Record<string, number>>('promotion.featured');
    const price = prices?.[duration] || 50;

    // Süreyi hesapla
    const days = parseInt(duration);
    const promotedUntil = new Date();
    promotedUntil.setDate(promotedUntil.getDate() + days);

    // Güncelle
    listing.promotion = {
      isPromoted: true,
      promotedUntil,
      promotionType: 'featured',
    };
    await listing.save();

    this.logger.log(`İlan öne çıkarıldı: ${listingId}, süre: ${duration}`);

    return {
      success: true,
      promotedUntil,
      price,
      promotionType: 'featured',
    };
  }

  /**
   * Acil badge ekle
   */
  async addUrgentBadge(listingId: string, userId: string): Promise<PromotionResult> {
    const listing = await this.validateOwnership(listingId, userId);

    const price = this.configService.get<number>('promotion.urgent.3d') || 30;

    // 3 gün süre
    const promotedUntil = new Date();
    promotedUntil.setDate(promotedUntil.getDate() + 3);

    listing.promotion = {
      isPromoted: true,
      promotedUntil,
      promotionType: 'urgent',
    };
    await listing.save();

    this.logger.log(`Acil badge eklendi: ${listingId}`);

    return {
      success: true,
      promotedUntil,
      price,
      promotionType: 'urgent',
    };
  }

  /**
   * İlanı yukarı taşı (bump up)
   */
  async bumpUp(listingId: string, userId: string): Promise<PromotionResult> {
    const listing = await this.validateOwnership(listingId, userId);

    const price = this.configService.get<number>('promotion.bumpUp') || 20;

    // createdAt'i güncelle (listede yukarı çıkması için)
    listing.createdAt = new Date();
    await listing.save();

    this.logger.log(`İlan yukarı taşındı: ${listingId}`);

    return {
      success: true,
      price,
      promotionType: 'bump',
    };
  }

  /**
   * Promosyonu iptal et
   */
  async cancelPromotion(listingId: string, userId: string): Promise<void> {
    const listing = await this.validateOwnership(listingId, userId);

    listing.promotion = {
      isPromoted: false,
      promotedUntil: undefined,
      promotionType: undefined,
    };
    await listing.save();

    this.logger.log(`Promosyon iptal edildi: ${listingId}`);
  }

  /**
   * Süresi dolan promosyonları temizle (cron job için)
   */
  async cleanupExpiredPromotions(): Promise<number> {
    const result = await this.listingModel.updateMany(
      {
        'promotion.isPromoted': true,
        'promotion.promotedUntil': { $lt: new Date() },
      },
      {
        $set: {
          'promotion.isPromoted': false,
          'promotion.promotedUntil': null,
          'promotion.promotionType': null,
        },
      },
    );

    if (result.modifiedCount > 0) {
      this.logger.log(`${result.modifiedCount} promosyon süresi doldu`);
    }

    return result.modifiedCount;
  }

  /**
   * Promosyon fiyatlarını getir
   */
  getPromotionPrices(): PromotionPrices {
    return {
      featured: {
        '7d': this.configService.get('promotion.featured.7d') || 50,
        '14d': this.configService.get('promotion.featured.14d') || 90,
        '30d': this.configService.get('promotion.featured.30d') || 150,
      },
      urgent: {
        '3d': this.configService.get('promotion.urgent.3d') || 30,
      },
      bumpUp: this.configService.get('promotion.bumpUp') || 20,
    };
  }

  /**
   * İlan sahipliğini doğrula
   */
  private async validateOwnership(
    listingId: string,
    userId: string,
  ): Promise<ListingDocument> {
    const listing = await this.listingModel.findById(listingId).exec();

    if (!listing) {
      throw new NotFoundException('İlan bulunamadı');
    }

    if (listing.sellerId.toString() !== userId) {
      throw new BadRequestException('Bu işlem için yetkiniz yok');
    }

    if (listing.status !== 'active') {
      throw new BadRequestException('Sadece aktif ilanlar için promosyon yapılabilir');
    }

    return listing;
  }
}

// ==================== Tipler ====================

interface PromotionResult {
  success: boolean;
  promotedUntil?: Date;
  price: number;
  promotionType: 'featured' | 'urgent' | 'bump';
}

interface PromotionPrices {
  featured: {
    '7d': number;
    '14d': number;
    '30d': number;
  };
  urgent: {
    '3d': number;
  };
  bumpUp: number;
}
