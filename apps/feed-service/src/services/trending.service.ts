import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Hashtag, HashtagDocument } from '../schemas/hashtag.schema';
import { Trend, TrendDocument } from '../schemas/trend.schema';
import { TrendingQueryDto } from '../dto/trending-query.dto';
import { TrendingResponseDto, TrendingItemDto } from '../dto/feed-response.dto';
import { FeedCacheService } from './feed-cache.service';
import { TrendingPeriod } from '../config';

/**
 * Trending Service
 * Gündem ve trend konularını yönetir
 */
@Injectable()
export class TrendingService {
  private readonly logger = new Logger(TrendingService.name);
  private readonly maxItems: number;
  private readonly cacheTtl: number;

  constructor(
    @InjectModel(Hashtag.name) private hashtagModel: Model<HashtagDocument>,
    @InjectModel(Trend.name) private trendModel: Model<TrendDocument>,
    private readonly configService: ConfigService,
    private readonly cacheService: FeedCacheService,
  ) {
    this.maxItems = this.configService.get<number>('limits.maxTrendingItems', 20);
    this.cacheTtl = this.configService.get<number>('cache.trendingTtl', 300);
  }

  /**
   * Trending konuları getir
   */
  async getTrending(query: TrendingQueryDto): Promise<TrendingResponseDto> {
    const { region = 'TR', period = TrendingPeriod.DAILY, limit = 20 } = query;
    const itemLimit = Math.min(limit, this.maxItems);

    // Cache kontrolü
    const cacheKey = `trending:${region}:${period}`;
    const cached = await this.cacheService.get<TrendingResponseDto>(cacheKey);
    
    if (cached) {
      this.logger.debug(`Trending cache hit: ${cacheKey}`);
      // Limit'e göre kes
      return {
        ...cached,
        data: {
          ...cached.data,
          hashtags: cached.data.hashtags.slice(0, itemLimit),
        },
      };
    }

    this.logger.debug(`Trending cache miss: ${cacheKey}`);

    // Önce trends collection'dan bak
    const existingTrends = await this.trendModel
      .find({
        region,
        period,
        expiresAt: { $gt: new Date() },
      })
      .sort({ rank: 1 })
      .limit(this.maxItems)
      .lean()
      .exec();

    if (existingTrends.length > 0) {
      const response = this.buildResponse(existingTrends, region, period);
      await this.cacheService.set(cacheKey, response, this.cacheTtl);
      return {
        ...response,
        data: {
          ...response.data,
          hashtags: response.data.hashtags.slice(0, itemLimit),
        },
      };
    }

    // Trends yoksa hashtag'lerden hesapla
    const trending = await this.calculateTrending(region, period);
    
    const response = this.buildResponse(trending, region, period);
    await this.cacheService.set(cacheKey, response, this.cacheTtl);

    return {
      ...response,
      data: {
        ...response.data,
        hashtags: response.data.hashtags.slice(0, itemLimit),
      },
    };
  }

  /**
   * Trending hesapla (hashtag istatistiklerinden)
   */
  private async calculateTrending(
    region: string,
    period: TrendingPeriod,
  ): Promise<TrendingItemDto[]> {
    // Periyoda göre sorgu alanı belirle
    let statsField: string;
    switch (period) {
      case TrendingPeriod.HOURLY:
        statsField = 'stats.postsToday';
        break;
      case TrendingPeriod.DAILY:
        statsField = 'stats.postsToday';
        break;
      case TrendingPeriod.WEEKLY:
        statsField = 'stats.postsThisWeek';
        break;
      default:
        statsField = 'stats.postsToday';
    }

    const hashtags = await this.hashtagModel
      .find({
        [statsField]: { $gt: 0 },
      })
      .sort({ [statsField]: -1, lastUsedAt: -1 })
      .limit(this.maxItems)
      .lean()
      .exec();

    return hashtags.map((hashtag, index) => ({
      tag: hashtag.tag,
      postsCount: this.getPostsCount(hashtag.stats, period),
      rank: index + 1,
    }));
  }

  /**
   * Periyoda göre post sayısını al
   */
  private getPostsCount(
    stats: { postsCount?: number; postsToday?: number; postsThisWeek?: number },
    period: TrendingPeriod,
  ): number {
    switch (period) {
      case TrendingPeriod.HOURLY:
      case TrendingPeriod.DAILY:
        return stats.postsToday || 0;
      case TrendingPeriod.WEEKLY:
        return stats.postsThisWeek || 0;
      default:
        return stats.postsCount || 0;
    }
  }

  /**
   * Response objesi oluştur
   */
  private buildResponse(
    items: (TrendDocument | TrendingItemDto)[],
    region: string,
    period: TrendingPeriod,
  ): TrendingResponseDto {
    const hashtags: TrendingItemDto[] = items.map((item, index) => {
      // TrendDocument ise
      if ('name' in item) {
        return {
          tag: item.name,
          postsCount: item.stats?.postsCount || 0,
          rank: item.rank || index + 1,
          category: undefined,
          description: undefined,
        };
      }
      // TrendingItemDto ise
      return item;
    });

    return {
      success: true,
      data: {
        hashtags,
        period,
        region,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Trending güncelle (scheduled job tarafından çağrılır)
   * Her 5 dakikada bir çalışır
   */
  async updateTrending(region: string = 'TR'): Promise<void> {
    this.logger.log(`Trending güncelleniyor: region=${region}`);

    for (const period of Object.values(TrendingPeriod)) {
      try {
        const trending = await this.calculateTrending(region, period);

        // Mevcut trendleri sil
        await this.trendModel.deleteMany({ region, period });

        // Yeni trendleri kaydet
        if (trending.length > 0) {
          const trends = trending.map((item, index) => ({
            type: 'hashtag',
            name: item.tag,
            stats: {
              postsCount: item.postsCount,
              score: item.postsCount, // Basit score
            },
            region,
            period,
            rank: index + 1,
            expiresAt: this.getExpiryDate(period),
            updatedAt: new Date(),
          }));

          await this.trendModel.insertMany(trends);
        }

        // Cache'i temizle
        await this.cacheService.delete(`trending:${region}:${period}`);

        this.logger.log(`Trending güncellendi: region=${region}, period=${period}, count=${trending.length}`);
      } catch (error) {
        this.logger.error(`Trending güncelleme hatası: ${error.message}`, error.stack);
      }
    }
  }

  /**
   * Periyoda göre expire tarihi hesapla
   */
  private getExpiryDate(period: TrendingPeriod): Date {
    const now = new Date();
    switch (period) {
      case TrendingPeriod.HOURLY:
        return new Date(now.getTime() + 60 * 60 * 1000); // 1 saat
      case TrendingPeriod.DAILY:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 gün
      case TrendingPeriod.WEEKLY:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 hafta
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Hashtag istatistiklerini güncelle
   * Post oluşturulduğunda/silindiğinde çağrılır
   */
  async updateHashtagStats(
    tag: string,
    increment: number = 1,
  ): Promise<void> {
    const normalizedTag = tag.toLowerCase().trim();

    await this.hashtagModel.findOneAndUpdate(
      { tag: normalizedTag },
      {
        $inc: {
          'stats.postsCount': increment,
          'stats.postsToday': increment,
          'stats.postsThisWeek': increment,
        },
        $set: {
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          tag: normalizedTag,
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
  }

  /**
   * Günlük istatistikleri sıfırla (scheduled job)
   * Her gün gece yarısı çalışır
   */
  async resetDailyStats(): Promise<void> {
    this.logger.log('Günlük hashtag istatistikleri sıfırlanıyor');
    
    await this.hashtagModel.updateMany(
      {},
      { $set: { 'stats.postsToday': 0 } },
    );
  }

  /**
   * Haftalık istatistikleri sıfırla (scheduled job)
   * Her pazartesi gece yarısı çalışır
   */
  async resetWeeklyStats(): Promise<void> {
    this.logger.log('Haftalık hashtag istatistikleri sıfırlanıyor');
    
    await this.hashtagModel.updateMany(
      {},
      { $set: { 'stats.postsThisWeek': 0 } },
    );
  }
}
