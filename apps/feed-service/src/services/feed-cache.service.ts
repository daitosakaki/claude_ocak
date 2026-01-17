import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheKeys } from '../config';

/**
 * Feed Cache Service
 * Redis cache yönetimi
 */
@Injectable()
export class FeedCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FeedCacheService.name);
  private redis: Redis;
  private readonly keyPrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.keyPrefix = this.configService.get<string>('redis.keyPrefix', 'feed:');
  }

  /**
   * Redis bağlantısını başlat
   */
  async onModuleInit(): Promise<void> {
    const redisConfig = {
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string>('redis.password'),
      db: this.configService.get<number>('redis.db', 0),
      keyPrefix: this.keyPrefix,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    this.redis = new Redis(redisConfig);

    this.redis.on('connect', () => {
      this.logger.log('Redis bağlantısı kuruldu');
    });

    this.redis.on('error', (err) => {
      this.logger.error(`Redis hatası: ${err.message}`);
    });

    // Bağlantı testi
    try {
      await this.redis.ping();
      this.logger.log('Redis ping başarılı');
    } catch (error) {
      this.logger.error(`Redis bağlantı hatası: ${error.message}`);
    }
  }

  /**
   * Redis bağlantısını kapat
   */
  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis bağlantısı kapatıldı');
    }
  }

  /**
   * Cache'den veri al
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(`Cache get hatası: key=${key}, error=${error.message}`);
      return null;
    }
  }

  /**
   * Cache'e veri kaydet
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Cache set hatası: key=${key}, error=${error.message}`);
    }
  }

  /**
   * Cache'den veri sil
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache delete hatası: key=${key}, error=${error.message}`);
    }
  }

  /**
   * Pattern ile toplu silme
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      // SCAN kullanarak güvenli şekilde key'leri bul
      const keys: string[] = [];
      let cursor = '0';

      do {
        const [newCursor, foundKeys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = newCursor;
        keys.push(...foundKeys);
      } while (cursor !== '0');

      if (keys.length === 0) return 0;

      // Key prefix'i çıkar (redis.del prefix olmadan bekler)
      const keysWithoutPrefix = keys.map(k => k.replace(this.keyPrefix, ''));
      
      const deleted = await this.redis.del(...keysWithoutPrefix);
      this.logger.debug(`Cache pattern silindi: pattern=${pattern}, count=${deleted}`);
      
      return deleted;
    } catch (error) {
      this.logger.error(`Cache deleteByPattern hatası: pattern=${pattern}, error=${error.message}`);
      return 0;
    }
  }

  /**
   * Home feed cache key'i oluştur
   */
  buildHomeFeedKey(userId: string, cursor?: string): string {
    const cursorPart = cursor || 'first';
    return `${CacheKeys.HOME_FEED}:${userId}:${cursorPart}`;
  }

  /**
   * Explore feed cache key'i oluştur
   */
  buildExploreFeedKey(cursor?: string): string {
    const cursorPart = cursor || 'first';
    return `${CacheKeys.EXPLORE_FEED}:${cursorPart}`;
  }

  /**
   * User timeline cache key'i oluştur
   */
  buildUserTimelineKey(userId: string, cursor?: string): string {
    const cursorPart = cursor || 'first';
    return `${CacheKeys.USER_TIMELINE}:${userId}:${cursorPart}`;
  }

  /**
   * Hashtag feed cache key'i oluştur
   */
  buildHashtagFeedKey(tag: string, cursor?: string): string {
    const cursorPart = cursor || 'first';
    return `${CacheKeys.HASHTAG_FEED}:${tag}:${cursorPart}`;
  }

  /**
   * Trending cache key'i oluştur
   */
  buildTrendingKey(region: string, period: string): string {
    return `${CacheKeys.TRENDING}:${region}:${period}`;
  }

  /**
   * Kullanıcının home feed cache'ini temizle
   */
  async invalidateHomeFeed(userId: string): Promise<void> {
    await this.deleteByPattern(`${CacheKeys.HOME_FEED}:${userId}:*`);
  }

  /**
   * Kullanıcının timeline cache'ini temizle
   */
  async invalidateUserTimeline(userId: string): Promise<void> {
    await this.deleteByPattern(`${CacheKeys.USER_TIMELINE}:${userId}:*`);
  }

  /**
   * Hashtag feed cache'ini temizle
   */
  async invalidateHashtagFeed(tag: string): Promise<void> {
    await this.deleteByPattern(`${CacheKeys.HASHTAG_FEED}:${tag}:*`);
  }

  /**
   * Tüm explore feed cache'ini temizle
   */
  async invalidateExploreFeed(): Promise<void> {
    await this.deleteByPattern(`${CacheKeys.EXPLORE_FEED}:*`);
  }

  /**
   * Tüm trending cache'ini temizle
   */
  async invalidateTrending(): Promise<void> {
    await this.deleteByPattern(`${CacheKeys.TRENDING}:*`);
  }

  /**
   * Following list cache'ini güncelle
   */
  async setFollowingList(userId: string, followingIds: string[]): Promise<void> {
    const key = `${CacheKeys.FOLLOWING_LIST}:${userId}`;
    await this.set(key, followingIds, 300); // 5 dakika
  }

  /**
   * Following list cache'ini al
   */
  async getFollowingList(userId: string): Promise<string[] | null> {
    const key = `${CacheKeys.FOLLOWING_LIST}:${userId}`;
    return this.get<string[]>(key);
  }

  /**
   * Following list cache'ini temizle
   */
  async invalidateFollowingList(userId: string): Promise<void> {
    const key = `${CacheKeys.FOLLOWING_LIST}:${userId}`;
    await this.delete(key);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Cache istatistikleri
   */
  async getStats(): Promise<{ keyCount: number; memoryUsage: string }> {
    try {
      const info = await this.redis.info('memory');
      const keyCount = await this.redis.dbsize();
      
      // Memory kullanımını parse et
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';

      return { keyCount, memoryUsage };
    } catch (error) {
      this.logger.error(`Cache stats hatası: ${error.message}`);
      return { keyCount: 0, memoryUsage: 'unknown' };
    }
  }
}
