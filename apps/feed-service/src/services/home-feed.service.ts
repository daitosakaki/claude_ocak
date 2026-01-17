import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Post, PostDocument } from '../schemas/post.schema';
import { Follow, FollowDocument } from '../schemas/follow.schema';
import { FeedQueryDto, FeedSortBy } from '../dto/feed-query.dto';
import { FeedResponseDto, PostDto } from '../dto/feed-response.dto';
import { FeedCacheService } from './feed-cache.service';

/**
 * Home Feed Service
 * Takip edilen kullanıcıların gönderilerini yönetir
 */
@Injectable()
export class HomeFeedService {
  private readonly logger = new Logger(HomeFeedService.name);
  private readonly defaultLimit: number;
  private readonly maxLimit: number;

  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    private readonly configService: ConfigService,
    private readonly cacheService: FeedCacheService,
  ) {
    this.defaultLimit = this.configService.get<number>('limits.defaultPageSize', 20);
    this.maxLimit = this.configService.get<number>('limits.maxPageSize', 50);
  }

  /**
   * Home feed - Takip edilen kullanıcıların gönderileri
   */
  async getFeed(userId: string, query: FeedQueryDto): Promise<FeedResponseDto> {
    const limit = Math.min(query.limit || this.defaultLimit, this.maxLimit);

    // 1. Takip edilen kullanıcı listesini al
    const followingIds = await this.getFollowingIds(userId);

    if (followingIds.length === 0) {
      this.logger.debug(`Kullanıcı kimseyi takip etmiyor: ${userId}`);
      return this.emptyResponse();
    }

    // 2. Sorgu filtrelerini oluştur
    const filter = this.buildFilter(followingIds, query);

    // 3. Cursor varsa ekle
    if (query.cursor) {
      const cursorDate = this.decodeCursor(query.cursor);
      if (cursorDate) {
        filter.createdAt = { $lt: cursorDate };
      }
    }

    // 4. Sıralama
    const sort = this.buildSort(query.sortBy);

    // 5. Sorguyu çalıştır
    this.logger.debug(`Home feed sorgusu: ${JSON.stringify(filter)}`);

    const posts = await this.postModel
      .find(filter)
      .sort(sort)
      .limit(limit + 1) // Bir fazla çek, hasMore için
      .populate('authorId', 'username displayName avatar isVerified')
      .lean()
      .exec();

    // 6. hasMore kontrolü
    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop(); // Fazla olanı çıkar
    }

    // 7. Response oluştur
    const nextCursor = hasMore && posts.length > 0
      ? this.encodeCursor(posts[posts.length - 1].createdAt)
      : undefined;

    return {
      success: true,
      data: posts.map(post => this.mapToDto(post)),
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  }

  /**
   * User Timeline - Belirli kullanıcının gönderileri
   */
  async getUserTimeline(
    targetUserId: string,
    query: FeedQueryDto,
  ): Promise<FeedResponseDto> {
    const limit = Math.min(query.limit || this.defaultLimit, this.maxLimit);

    // Filtre
    const filter: Record<string, unknown> = {
      authorId: new Types.ObjectId(targetUserId),
      status: 'active',
      visibility: 'public', // TODO: Takipçi kontrolü ile genişlet
    };

    // Repost'ları dahil et/etme
    if (!query.includeReposts) {
      filter['repost.isRepost'] = { $ne: true };
    }

    // Sadece medyalı
    if (query.mediaOnly) {
      filter['content.media'] = { $exists: true, $ne: [] };
    }

    // Cursor
    if (query.cursor) {
      const cursorDate = this.decodeCursor(query.cursor);
      if (cursorDate) {
        filter.createdAt = { $lt: cursorDate };
      }
    }

    // Sıralama: Pinlenmiş olanlar önce, sonra tarih
    const sort: Record<string, 1 | -1> = {
      isPinned: -1,
      createdAt: -1,
    };

    const posts = await this.postModel
      .find(filter)
      .sort(sort)
      .limit(limit + 1)
      .populate('authorId', 'username displayName avatar isVerified')
      .lean()
      .exec();

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    const nextCursor = hasMore && posts.length > 0
      ? this.encodeCursor(posts[posts.length - 1].createdAt)
      : undefined;

    return {
      success: true,
      data: posts.map(post => this.mapToDto(post)),
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  }

  /**
   * Takip edilen kullanıcı ID'lerini al
   * Cache'den veya veritabanından
   */
  private async getFollowingIds(userId: string): Promise<Types.ObjectId[]> {
    // Cache kontrolü
    const cacheKey = `following:${userId}`;
    const cached = await this.cacheService.get<string[]>(cacheKey);
    
    if (cached) {
      return cached.map(id => new Types.ObjectId(id));
    }

    // Veritabanından çek
    const follows = await this.followModel
      .find({
        followerId: new Types.ObjectId(userId),
        status: 'active',
      })
      .select('followingId')
      .lean()
      .exec();

    const followingIds = follows.map(f => f.followingId);

    // Cache'e kaydet (5 dakika)
    if (followingIds.length > 0) {
      await this.cacheService.set(
        cacheKey,
        followingIds.map(id => id.toString()),
        300,
      );
    }

    return followingIds;
  }

  /**
   * Sorgu filtresi oluştur
   */
  private buildFilter(
    authorIds: Types.ObjectId[],
    query: FeedQueryDto,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      authorId: { $in: authorIds },
      status: 'active',
      visibility: { $in: ['public', 'followers'] },
    };

    // Repost filtresi
    if (!query.includeReposts) {
      filter['repost.isRepost'] = { $ne: true };
    }

    // Yanıt filtresi
    if (!query.includeReplies) {
      filter.parentId = { $exists: false };
    }

    // Sadece medyalı
    if (query.mediaOnly) {
      filter['content.media'] = { $exists: true, $ne: [] };
    }

    // Sadece anketli
    if (query.pollsOnly) {
      filter.type = 'poll';
    }

    return filter;
  }

  /**
   * Sıralama kriterleri
   */
  private buildSort(sortBy?: FeedSortBy): Record<string, 1 | -1> {
    switch (sortBy) {
      case FeedSortBy.POPULAR:
        return { 'stats.likesCount': -1, createdAt: -1 };
      case FeedSortBy.RELEVANT:
        // TODO: Relevance algoritması eklenecek
        return { createdAt: -1 };
      case FeedSortBy.RECENT:
      default:
        return { createdAt: -1 };
    }
  }

  /**
   * Cursor encode (tarih -> base64)
   */
  private encodeCursor(date: Date): string {
    return Buffer.from(JSON.stringify({ d: date.toISOString() })).toString('base64');
  }

  /**
   * Cursor decode (base64 -> tarih)
   */
  private decodeCursor(cursor: string): Date | null {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
      return new Date(decoded.d);
    } catch {
      this.logger.warn(`Geçersiz cursor: ${cursor}`);
      return null;
    }
  }

  /**
   * Post entity'sini DTO'ya dönüştür
   */
  private mapToDto(post: PostDocument & { authorId: { username: string; displayName: string; avatar?: string; isVerified: boolean } }): PostDto {
    const author = post.authorId as unknown as { 
      _id: Types.ObjectId;
      username: string; 
      displayName: string; 
      avatar?: string; 
      isVerified: boolean;
    };

    return {
      id: post._id.toString(),
      author: {
        id: author._id.toString(),
        username: author.username,
        displayName: author.displayName,
        avatar: author.avatar,
        isVerified: author.isVerified || false,
      },
      type: post.type,
      content: {
        text: post.content?.text,
        media: post.content?.media?.map(m => ({
          type: m.type,
          url: m.url,
          thumbnailUrl: m.thumbnailUrl,
          width: m.width,
          height: m.height,
          duration: m.duration,
          blurhash: m.blurhash,
        })),
        poll: post.content?.poll ? {
          question: post.content.poll.question,
          options: post.content.poll.options.map(o => ({
            id: o.id,
            text: o.text,
            votesCount: o.votesCount || 0,
            percentage: post.content.poll.totalVotes > 0
              ? (o.votesCount / post.content.poll.totalVotes) * 100
              : 0,
          })),
          totalVotes: post.content.poll.totalVotes || 0,
          endsAt: post.content.poll.endsAt?.toISOString(),
          hasVoted: false, // TODO: Kullanıcı kontrolü
          myVote: undefined,
        } : undefined,
      },
      visibility: post.visibility,
      stats: {
        likesCount: post.stats?.likesCount || 0,
        dislikesCount: post.stats?.dislikesCount || 0,
        commentsCount: post.stats?.commentsCount || 0,
        repostsCount: post.stats?.repostsCount || 0,
        viewsCount: post.stats?.viewsCount || 0,
        bookmarksCount: post.stats?.bookmarksCount || 0,
      },
      hashtags: post.hashtags || [],
      repost: post.repost?.isRepost ? {
        isRepost: true,
        originalPostId: post.repost.originalPostId?.toString(),
        isQuote: post.repost.isQuote || false,
      } : undefined,
      isPinned: post.isPinned || false,
      commentsDisabled: post.commentsDisabled || false,
      isLiked: false, // TODO: Kullanıcı etkileşimleri
      isDisliked: false,
      isReposted: false,
      isBookmarked: false,
      createdAt: post.createdAt.toISOString(),
    };
  }

  /**
   * Boş response döndür
   */
  private emptyResponse(): FeedResponseDto {
    return {
      success: true,
      data: [],
      pagination: {
        hasMore: false,
      },
    };
  }
}
