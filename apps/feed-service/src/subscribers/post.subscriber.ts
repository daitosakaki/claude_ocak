import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeedCacheService } from '../services/feed-cache.service';
import { TrendingService } from '../services/trending.service';
import { EventTypes } from '../config';

/**
 * Post Event yapısı
 */
interface PostEvent {
  type: string;
  data: {
    postId: string;
    authorId: string;
    hashtags?: string[];
    visibility?: string;
    timestamp: string;
  };
}

/**
 * Post Subscriber
 * Post event'lerini dinler ve cache invalidation yapar
 * 
 * Dinlenen eventler:
 * - post.created: Yeni post oluşturuldu
 * - post.updated: Post güncellendi
 * - post.deleted: Post silindi
 */
@Injectable()
export class PostSubscriber implements OnModuleInit {
  private readonly logger = new Logger(PostSubscriber.name);
  private readonly topicName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: FeedCacheService,
    private readonly trendingService: TrendingService,
  ) {
    this.topicName = this.configService.get<string>(
      'pubsub.postEventsTopic',
      'post-events',
    );
  }

  /**
   * Modül başlatıldığında subscription'ı başlat
   */
  async onModuleInit(): Promise<void> {
    this.logger.log(`Post subscriber başlatılıyor: topic=${this.topicName}`);
    
    // TODO: GCP Pub/Sub subscription kurulumu
    // Şimdilik mock olarak bırakıyoruz
    // Gerçek implementasyonda @google-cloud/pubsub kullanılacak
    
    /*
    const pubsub = new PubSub({ projectId: this.configService.get('pubsub.projectId') });
    const subscription = pubsub.subscription(this.configService.get('pubsub.feedSubscription'));
    
    subscription.on('message', (message) => {
      this.handleMessage(message);
    });
    
    subscription.on('error', (error) => {
      this.logger.error(`Subscription hatası: ${error.message}`);
    });
    */
  }

  /**
   * Gelen mesajı işle
   */
  async handleMessage(message: { data: Buffer; ack: () => void }): Promise<void> {
    try {
      const event: PostEvent = JSON.parse(message.data.toString());
      this.logger.debug(`Post event alındı: ${event.type}`);

      switch (event.type) {
        case EventTypes.POST_CREATED:
          await this.handlePostCreated(event);
          break;
        case EventTypes.POST_UPDATED:
          await this.handlePostUpdated(event);
          break;
        case EventTypes.POST_DELETED:
          await this.handlePostDeleted(event);
          break;
        default:
          this.logger.warn(`Bilinmeyen event tipi: ${event.type}`);
      }

      message.ack();
    } catch (error) {
      this.logger.error(`Post event işleme hatası: ${error.message}`, error.stack);
      // Hata durumunda mesajı ack etmiyoruz, retry olacak
    }
  }

  /**
   * Yeni post oluşturuldu
   */
  private async handlePostCreated(event: PostEvent): Promise<void> {
    const { authorId, hashtags } = event.data;
    
    this.logger.debug(`Post created: authorId=${authorId}`);

    // 1. Yazarın timeline cache'ini temizle
    await this.cacheService.invalidateUserTimeline(authorId);

    // 2. Hashtag istatistiklerini güncelle
    if (hashtags && hashtags.length > 0) {
      for (const tag of hashtags) {
        await this.trendingService.updateHashtagStats(tag, 1);
        await this.cacheService.invalidateHashtagFeed(tag);
      }
    }

    // 3. Explore feed cache'ini temizle (yeni popüler içerik olabilir)
    // Not: Bu işlem yoğun trafikte performans sorunu olabilir
    // Alternatif: Sadece belirli aralıklarla temizle
    await this.cacheService.invalidateExploreFeed();

    // 4. Takipçilerin home feed cache'lerini temizle
    // Not: Bu işlem async olarak arka planda yapılmalı
    // Çok takipçisi olan kullanıcılar için batch işlem gerekli
    await this.invalidateFollowersHomeFeed(authorId);
  }

  /**
   * Post güncellendi
   */
  private async handlePostUpdated(event: PostEvent): Promise<void> {
    const { authorId, postId, hashtags } = event.data;
    
    this.logger.debug(`Post updated: postId=${postId}`);

    // 1. Yazarın timeline cache'ini temizle
    await this.cacheService.invalidateUserTimeline(authorId);

    // 2. Hashtag feed'lerini temizle
    if (hashtags && hashtags.length > 0) {
      for (const tag of hashtags) {
        await this.cacheService.invalidateHashtagFeed(tag);
      }
    }
  }

  /**
   * Post silindi
   */
  private async handlePostDeleted(event: PostEvent): Promise<void> {
    const { authorId, hashtags } = event.data;
    
    this.logger.debug(`Post deleted: authorId=${authorId}`);

    // 1. Yazarın timeline cache'ini temizle
    await this.cacheService.invalidateUserTimeline(authorId);

    // 2. Hashtag istatistiklerini güncelle (azalt)
    if (hashtags && hashtags.length > 0) {
      for (const tag of hashtags) {
        await this.trendingService.updateHashtagStats(tag, -1);
        await this.cacheService.invalidateHashtagFeed(tag);
      }
    }

    // 3. Explore feed cache'ini temizle
    await this.cacheService.invalidateExploreFeed();

    // 4. Takipçilerin home feed cache'lerini temizle
    await this.invalidateFollowersHomeFeed(authorId);
  }

  /**
   * Takipçilerin home feed cache'lerini temizle
   * Not: Gerçek implementasyonda bu işlem async job olarak yapılmalı
   */
  private async invalidateFollowersHomeFeed(authorId: string): Promise<void> {
    // TODO: User service'den takipçi listesini al
    // Her takipçi için home feed cache'ini temizle
    // Bu işlem batch olarak yapılmalı
    
    this.logger.debug(`Takipçi home feed invalidation: authorId=${authorId}`);
    
    // Şimdilik sadece log'luyoruz
    // Gerçek implementasyonda:
    // 1. User service'e HTTP isteği at (veya Redis'ten oku)
    // 2. Takipçi listesini al
    // 3. Her takipçi için: cacheService.invalidateHomeFeed(followerId)
  }

  /**
   * Manuel event işleme (test veya fallback için)
   */
  async processEvent(event: PostEvent): Promise<void> {
    await this.handleMessage({
      data: Buffer.from(JSON.stringify(event)),
      ack: () => {},
    });
  }
}
