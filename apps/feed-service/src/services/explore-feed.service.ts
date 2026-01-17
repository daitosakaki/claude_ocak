import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Post, PostDocument } from '../schemas/post.schema';
import { FeedQueryDto, FeedSortBy } from '../dto/feed-query.dto';
import { FeedResponseDto, PostDto } from '../dto/feed-response.dto';

/**
 * Explore Feed Service
 * Popüler ve keşfet gönderilerini yönetir
 */
@Injectable()
export class ExploreFeedService {
  private readonly logger = new Logger(ExploreFeedService.name);
  private readonly defaultLimit: number;
  private readonly maxLimit: number;

  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private readonly configService: ConfigService,
  ) {
    this.defaultLimit = this.configService.get<number>('limits.defaultPageSize', 20);
    this.maxLimit = this.configService.get<number>('limits.maxPageSize', 50);
  }

  /**
   * Explore feed - Popüler/algoritmik gönderiler
   * Sıralama: Engagement skoru + recency
   */
  async getFeed(query: FeedQueryDto): Promise<FeedResponseDto> {
    const limit = Math.min(query.limit || this.defaultLimit, this.maxLimit);

    // Temel filtre
    const filter: Record<string, unknown> = {
      status: 'active',
      visibility: 'public',
      // Son 7 gün içindeki gönderiler
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    };

    // Repost'ları dahil etme (explore'da sadece orijinal içerik)
    if (!query.includeReposts) {
      filter['repost.isRepost'] = { $ne: true };
    }

    // Sadece medyalı
    if (query.mediaOnly) {
      filter['content.media'] = { $exists: true, $ne: [] };
    }

    // Sadece anketli
    if (query.pollsOnly) {
      filter.type = 'poll';
    }

    // Cursor varsa (engagement score bazlı)
    if (query.cursor) {
      const cursorData = this.decodeCursor(query.cursor);
      if (cursorData) {
        // Cursor: { score: number, id: string }
        filter.$or = [
          { _engagementScore: { $lt: cursorData.score } },
          {
            _engagementScore: cursorData.score,
            _id: { $lt: new Types.ObjectId(cursorData.id) },
          },
        ];
      }
    }

    this.logger.debug(`Explore feed sorgusu: ${JSON.stringify(filter)}`);

    // Aggregation pipeline kullan (engagement score hesaplama)
    const posts = await this.postModel.aggregate([
      { $match: filter },
      // Engagement score hesapla
      {
        $addFields: {
          _engagementScore: {
            $add: [
              { $multiply: ['$stats.likesCount', 1] },
              { $multiply: ['$stats.commentsCount', 3] },
              { $multiply: ['$stats.repostsCount', 5] },
              { $multiply: ['$stats.bookmarksCount', 2] },
              // Recency bonus (son 24 saat içindekiler için)
              {
                $cond: {
                  if: {
                    $gte: [
                      '$createdAt',
                      new Date(Date.now() - 24 * 60 * 60 * 1000),
                    ],
                  },
                  then: 10,
                  else: 0,
                },
              },
            ],
          },
        },
      },
      // Sıralama
      { $sort: { _engagementScore: -1, _id: -1 } },
      // Limit
      { $limit: limit + 1 },
      // Author bilgisini join et
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            {
              $project: {
                username: 1,
                displayName: 1,
                avatar: 1,
                isVerified: 1,
              },
            },
          ],
        },
      },
      { $unwind: '$author' },
    ]).exec();

    // hasMore kontrolü
    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    // Next cursor
    const nextCursor = hasMore && posts.length > 0
      ? this.encodeCursor({
          score: posts[posts.length - 1]._engagementScore,
          id: posts[posts.length - 1]._id.toString(),
        })
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
   * Hashtag Feed - Belirli hashtag'e sahip gönderiler
   */
  async getHashtagFeed(
    tag: string,
    query: FeedQueryDto,
  ): Promise<FeedResponseDto> {
    const limit = Math.min(query.limit || this.defaultLimit, this.maxLimit);

    const filter: Record<string, unknown> = {
      hashtags: tag.toLowerCase(),
      status: 'active',
      visibility: 'public',
    };

    // Cursor
    if (query.cursor) {
      const cursorDate = this.decodeDateCursor(query.cursor);
      if (cursorDate) {
        filter.createdAt = { $lt: cursorDate };
      }
    }

    // Sıralama seçeneği
    let sort: Record<string, 1 | -1>;
    switch (query.sortBy) {
      case FeedSortBy.POPULAR:
        sort = { 'stats.likesCount': -1, createdAt: -1 };
        break;
      case FeedSortBy.RECENT:
      default:
        sort = { createdAt: -1 };
    }

    this.logger.debug(`Hashtag feed sorgusu: tag=${tag}, filter=${JSON.stringify(filter)}`);

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
      ? this.encodeDateCursor(posts[posts.length - 1].createdAt)
      : undefined;

    return {
      success: true,
      data: posts.map(post => this.mapToDto(post as any)),
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  }

  /**
   * Score-based cursor encode
   */
  private encodeCursor(data: { score: number; id: string }): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  /**
   * Score-based cursor decode
   */
  private decodeCursor(cursor: string): { score: number; id: string } | null {
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    } catch {
      this.logger.warn(`Geçersiz cursor: ${cursor}`);
      return null;
    }
  }

  /**
   * Date-based cursor encode
   */
  private encodeDateCursor(date: Date): string {
    return Buffer.from(JSON.stringify({ d: date.toISOString() })).toString('base64');
  }

  /**
   * Date-based cursor decode
   */
  private decodeDateCursor(cursor: string): Date | null {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
      return new Date(decoded.d);
    } catch {
      return null;
    }
  }

  /**
   * Post'u DTO'ya dönüştür
   */
  private mapToDto(post: any): PostDto {
    const author = post.author || post.authorId;

    return {
      id: post._id.toString(),
      author: {
        id: author._id?.toString() || author.toString(),
        username: author.username || '',
        displayName: author.displayName || '',
        avatar: author.avatar,
        isVerified: author.isVerified || false,
      },
      type: post.type,
      content: {
        text: post.content?.text,
        media: post.content?.media?.map((m: any) => ({
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
          options: post.content.poll.options.map((o: any) => ({
            id: o.id,
            text: o.text,
            votesCount: o.votesCount || 0,
            percentage: post.content.poll.totalVotes > 0
              ? (o.votesCount / post.content.poll.totalVotes) * 100
              : 0,
          })),
          totalVotes: post.content.poll.totalVotes || 0,
          endsAt: post.content.poll.endsAt?.toISOString?.() || post.content.poll.endsAt,
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
      isLiked: false,
      isDisliked: false,
      isReposted: false,
      isBookmarked: false,
      createdAt: post.createdAt?.toISOString?.() || post.createdAt,
    };
  }
}
