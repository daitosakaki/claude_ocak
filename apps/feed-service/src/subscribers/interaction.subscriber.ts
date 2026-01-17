import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeedCacheService } from '../services/feed-cache.service';
import { EventTypes } from '../config';

/**
 * Interaction Event yapısı
 */
interface InteractionEvent {
  type: string;
  data: {
    interactionId?: string;
    userId: string;
    targetType: 'post' | 'comment';
    targetId: string;
    postAuthorId?: string;
    interactionType?: 'like' | 'dislike' | 'repost' | 'bookmark';
    timestamp: string;
  };
}

/**
 * Interaction Subscriber
 * Etkileşim event'lerini dinler ve gerekli cache güncellemelerini yapar
 * 
 * Dinlenen eventler:
 * - post.liked / post.unliked
 * - post.commented
 * - post.reposted
 */
@Injectable()
export class InteractionSubscriber implements OnModuleInit {
  private readonly logger = new Logger(InteractionSubscriber.name);
  private readonly topicName: string;

  // Explore feed'in ne sıklıkla güncelleneceğini kontrol et
  // Çok fazla etkileşim olduğunda her seferinde cache temizlemek yerine
  // belirli aralıklarla temizle
  private lastExploreCacheInvalidation: number = 0;
  private readonly exploreCacheInvalidationInterval: number = 60000; // 1 dakika

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: FeedCacheService,
  ) {
    this.topicName = this.configService.get<string>(
      'pubsub.interactionEventsTopic',
      'interaction-events',
    );
  }

  /**
   * Modül başlatıldığında subscription'ı başlat
   */
  async onModuleInit(): Promise<void> {
    this.logger.log(`Interaction subscriber başlatılıyor: topic=${this.topicName}`);
    
    // TODO: GCP Pub/Sub subscription kurulumu
    // Gerçek implementasyonda @google-cloud/pubsub kullanılacak
  }

  /**
   * Gelen mesajı işle
   */
  async handleMessage(message: { data: Buffer; ack: () => void }): Promise<void> {
    try {
      const event: InteractionEvent = JSON.parse(message.data.toString());
      this.logger.debug(`Interaction event alındı: ${event.type}`);

      switch (event.type) {
        case EventTypes.POST_LIKED:
        case EventTypes.POST_UNLIKED:
          await this.handleLikeEvent(event);
          break;
        case EventTypes.POST_COMMENTED:
          await this.handleCommentEvent(event);
          break;
        case EventTypes.POST_REPOSTED:
          await this.handleRepostEvent(event);
          break;
        default:
          this.logger.debug(`Interaction subscriber: atlanıyor: ${event.type}`);
      }

      message.ack();
    } catch (error) {
      this.logger.error(`Interaction event işleme hatası: ${error.message}`, error.stack);
    }
  }

  /**
   * Like/unlike eventi
   */
  private async handleLikeEvent(event: InteractionEvent): Promise<void> {
    const { targetId, postAuthorId } = event.data;
    
    this.logger.debug(`Like event: postId=${targetId}`);

    // Post yazarının timeline cache'ini temizle
    // (like sayısı değişti)
    if (postAuthorId) {
      await this.cacheService.invalidateUserTimeline(postAuthorId);
    }

    // Explore feed'i periyodik olarak güncelle
    // (popülerlik sıralaması değişebilir)
    await this.maybeInvalidateExploreFeed();
  }

  /**
   * Comment eventi
   */
  private async handleCommentEvent(event: InteractionEvent): Promise<void> {
    const { targetId, postAuthorId } = event.data;
    
    this.logger.debug(`Comment event: postId=${targetId}`);

    // Post yazarının timeline cache'ini temizle
    if (postAuthorId) {
      await this.cacheService.invalidateUserTimeline(postAuthorId);
    }

    // Explore feed'i periyodik olarak güncelle
    await this.maybeInvalidateExploreFeed();
  }

  /**
   * Repost eventi
   */
  private async handleRepostEvent(event: InteractionEvent): Promise<void> {
    const { userId, targetId, postAuthorId } = event.data;
    
    this.logger.debug(`Repost event: postId=${targetId}, userId=${userId}`);

    // Repost yapan kullanıcının timeline cache'ini temizle
    await this.cacheService.invalidateUserTimeline(userId);

    // Orijinal post yazarının timeline cache'ini temizle
    if (postAuthorId) {
      await this.cacheService.invalidateUserTimeline(postAuthorId);
    }

    // Repost yapan kullanıcının takipçilerinin home feed'ini temizle
    await this.invalidateFollowersHomeFeed(userId);

    // Explore feed'i periyodik olarak güncelle
    await this.maybeInvalidateExploreFeed();
  }

  /**
   * Explore feed'i belirli aralıklarla temizle
   * Çok fazla etkileşim olduğunda her seferinde temizlemek yerine
   * belirli aralıklarla temizle (rate limiting)
   */
  private async maybeInvalidateExploreFeed(): Promise<void> {
    const now = Date.now();
    
    if (now - this.lastExploreCacheInvalidation >= this.exploreCacheInvalidationInterval) {
      this.logger.debug('Explore feed cache temizleniyor (interval)');
      await this.cacheService.invalidateExploreFeed();
      this.lastExploreCacheInvalidation = now;
    }
  }

  /**
   * Takipçilerin home feed cache'lerini temizle
   */
  private async invalidateFollowersHomeFeed(userId: string): Promise<void> {
    // TODO: Gerçek implementasyonda async job olarak yapılmalı
    this.logger.debug(`Takipçi home feed invalidation: userId=${userId}`);
  }

  /**
   * Follow eventi (user-events topic'inden)
   */
  async handleFollowEvent(event: {
    type: string;
    data: { followerId: string; followingId: string };
  }): Promise<void> {
    const { followerId, followingId } = event.data;
    
    this.logger.debug(`Follow event: follower=${followerId}, following=${followingId}`);

    // Takipçinin following listesi cache'ini temizle
    await this.cacheService.invalidateFollowingList(followerId);

    // Takipçinin home feed cache'ini temizle
    // (yeni takip edilen kişinin postları görünecek)
    await this.cacheService.invalidateHomeFeed(followerId);
  }

  /**
   * Unfollow eventi
   */
  async handleUnfollowEvent(event: {
    type: string;
    data: { followerId: string; followingId: string };
  }): Promise<void> {
    const { followerId, followingId } = event.data;
    
    this.logger.debug(`Unfollow event: follower=${followerId}, following=${followingId}`);

    // Takipçinin following listesi cache'ini temizle
    await this.cacheService.invalidateFollowingList(followerId);

    // Takipçinin home feed cache'ini temizle
    // (takip bırakılan kişinin postları artık görünmeyecek)
    await this.cacheService.invalidateHomeFeed(followerId);
  }

  /**
   * Manuel event işleme (test veya fallback için)
   */
  async processEvent(event: InteractionEvent): Promise<void> {
    await this.handleMessage({
      data: Buffer.from(JSON.stringify(event)),
      ack: () => {},
    });
  }
}
