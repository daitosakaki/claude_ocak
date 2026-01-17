import { Injectable, Logger } from '@nestjs/common';
import { HomeFeedService } from './services/home-feed.service';
import { ExploreFeedService } from './services/explore-feed.service';
import { FeedCacheService } from './services/feed-cache.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { FeedResponseDto } from './dto/feed-response.dto';

/**
 * Feed Service - Ana orkestratör servis
 * Alt servisleri koordine eder ve cache yönetimini sağlar
 */
@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    private readonly homeFeedService: HomeFeedService,
    private readonly exploreFeedService: ExploreFeedService,
    private readonly cacheService: FeedCacheService,
  ) {}

  /**
   * Home Feed - Takip edilen kullanıcıların gönderileri
   * Cache stratejisi: 1 dakika TTL
   */
  async getHomeFeed(
    userId: string,
    query: FeedQueryDto,
  ): Promise<FeedResponseDto> {
    this.logger.debug(`Home feed isteği: userId=${userId}, cursor=${query.cursor}`);

    // Cache kontrolü
    const cacheKey = this.cacheService.buildHomeFeedKey(userId, query.cursor);
    const cached = await this.cacheService.get<FeedResponseDto>(cacheKey);
    
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    // Cache miss - veritabanından çek
    this.logger.debug(`Cache miss: ${cacheKey}`);
    const result = await this.homeFeedService.getFeed(userId, query);

    // Cache'e kaydet (1 dakika)
    await this.cacheService.set(cacheKey, result, 60);

    return result;
  }

  /**
   * Explore Feed - Algoritmik/popüler gönderiler
   * Cache stratejisi: 1 dakika TTL (user-agnostic kısım 5 dakika)
   */
  async getExploreFeed(
    userId: string,
    query: FeedQueryDto,
  ): Promise<FeedResponseDto> {
    this.logger.debug(`Explore feed isteği: userId=${userId}, cursor=${query.cursor}`);

    // Explore feed user-agnostic olduğu için farklı cache stratejisi
    const cacheKey = this.cacheService.buildExploreFeedKey(query.cursor);
    const cached = await this.cacheService.get<FeedResponseDto>(cacheKey);
    
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      // User-specific enrichment (liked, bookmarked durumları)
      return this.enrichWithUserInteractions(cached, userId);
    }

    // Cache miss
    this.logger.debug(`Cache miss: ${cacheKey}`);
    const result = await this.exploreFeedService.getFeed(query);

    // Cache'e kaydet (5 dakika - user-agnostic)
    await this.cacheService.set(cacheKey, result, 300);

    // User-specific enrichment
    return this.enrichWithUserInteractions(result, userId);
  }

  /**
   * User Timeline - Belirli kullanıcının gönderileri
   * Cache stratejisi: 2 dakika TTL
   */
  async getUserTimeline(
    targetUserId: string,
    currentUserId: string,
    query: FeedQueryDto,
  ): Promise<FeedResponseDto> {
    this.logger.debug(`User timeline isteği: targetUserId=${targetUserId}`);

    // Cache kontrolü
    const cacheKey = this.cacheService.buildUserTimelineKey(targetUserId, query.cursor);
    const cached = await this.cacheService.get<FeedResponseDto>(cacheKey);
    
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return this.enrichWithUserInteractions(cached, currentUserId);
    }

    // Cache miss
    this.logger.debug(`Cache miss: ${cacheKey}`);
    const result = await this.homeFeedService.getUserTimeline(targetUserId, query);

    // Cache'e kaydet (2 dakika)
    await this.cacheService.set(cacheKey, result, 120);

    return this.enrichWithUserInteractions(result, currentUserId);
  }

  /**
   * Hashtag Feed - Belirli hashtag'e sahip gönderiler
   * Cache stratejisi: 2 dakika TTL
   */
  async getHashtagFeed(
    tag: string,
    userId: string,
    query: FeedQueryDto,
  ): Promise<FeedResponseDto> {
    // Tag'i normalize et (lowercase, trim)
    const normalizedTag = tag.toLowerCase().trim().replace(/^#/, '');
    
    this.logger.debug(`Hashtag feed isteği: tag=${normalizedTag}`);

    // Cache kontrolü
    const cacheKey = this.cacheService.buildHashtagFeedKey(normalizedTag, query.cursor);
    const cached = await this.cacheService.get<FeedResponseDto>(cacheKey);
    
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return this.enrichWithUserInteractions(cached, userId);
    }

    // Cache miss
    this.logger.debug(`Cache miss: ${cacheKey}`);
    const result = await this.exploreFeedService.getHashtagFeed(normalizedTag, query);

    // Cache'e kaydet (2 dakika)
    await this.cacheService.set(cacheKey, result, 120);

    return this.enrichWithUserInteractions(result, userId);
  }

  /**
   * Cache invalidation - Yeni post geldiğinde
   * Pub/Sub event'i ile tetiklenir
   */
  async invalidateUserFeeds(userId: string): Promise<void> {
    this.logger.debug(`User feed cache invalidation: userId=${userId}`);
    
    // Kullanıcının kendi timeline cache'ini temizle
    await this.cacheService.invalidateUserTimeline(userId);
    
    // Takipçilerin home feed cache'lerini temizle
    // Not: Bu işlem için takipçi listesi gerekli, 
    // performans için async/batch işlem yapılabilir
  }

  /**
   * Post'ları kullanıcı etkileşimleriyle zenginleştir
   * (isLiked, isDisliked, isBookmarked, isReposted)
   */
  private async enrichWithUserInteractions(
    feed: FeedResponseDto,
    userId: string,
  ): Promise<FeedResponseDto> {
    if (!userId || !feed.data || feed.data.length === 0) {
      return feed;
    }

    // TODO: Kullanıcının etkileşimlerini toplu sorgula
    // Bu işlem interaction-service'e HTTP çağrısı gerektirebilir
    // veya Redis'te tutulabilir

    // Şimdilik olduğu gibi döndür
    return feed;
  }
}
