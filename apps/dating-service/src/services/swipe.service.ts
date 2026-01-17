import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Swipe, SwipeAction } from '../schemas/swipe.schema';
import { Match, MatchStatus } from '../schemas/match.schema';
import { DatingProfile } from '../schemas/dating-profile.schema';
import { SwipeDto, SwipeResultDto, RewindResultDto } from '../dto/swipe.dto';
import { DatingPublisher } from '../events/dating.publisher';

/**
 * SwipeService
 * Swipe işlemlerini (like, pass, superlike) ve limitleri yönetir
 */
@Injectable()
export class SwipeService {
  private readonly logger = new Logger(SwipeService.name);

  constructor(
    @InjectModel(Swipe.name)
    private readonly swipeModel: Model<Swipe>,
    @InjectModel(Match.name)
    private readonly matchModel: Model<Match>,
    @InjectModel(DatingProfile.name)
    private readonly profileModel: Model<DatingProfile>,
    private readonly configService: ConfigService,
    private readonly publisher: DatingPublisher,
  ) {}

  /**
   * Bir profile swipe yapar (like/pass/superlike)
   */
  async swipe(userId: string, dto: SwipeDto): Promise<SwipeResultDto> {
    this.logger.debug(`Swipe işlemi: ${userId} -> ${dto.targetId} (${dto.action})`);

    const userObjectId = new Types.ObjectId(userId);
    const targetObjectId = new Types.ObjectId(dto.targetId);

    // Kendine swipe kontrolü
    if (userId === dto.targetId) {
      throw new BadRequestException('Kendinize swipe yapamazsınız');
    }

    // Hedef profil kontrolü
    const targetProfile = await this.profileModel
      .findOne({ userId: targetObjectId, isActive: true })
      .lean();

    if (!targetProfile) {
      throw new NotFoundException('Hedef profil bulunamadı');
    }

    // Limit kontrolü (like ve superlike için)
    if (dto.action !== SwipeAction.PASS) {
      await this.checkSwipeLimits(userId, dto.action);
    }

    // Daha önce swipe yapılmış mı kontrolü
    const existingSwipe = await this.swipeModel.findOne({
      swiperId: userObjectId,
      targetId: targetObjectId,
      isRewound: false,
    });

    if (existingSwipe) {
      throw new BadRequestException('Bu profile zaten swipe yaptınız');
    }

    // Swipe kaydı oluştur
    const swipe = new this.swipeModel({
      swiperId: userObjectId,
      targetId: targetObjectId,
      action: dto.action,
      swipedAt: new Date(),
    });

    await swipe.save();

    // Eşleşme kontrolü (karşı taraf da like attıysa)
    let isMatch = false;
    let matchId: string | undefined;
    let conversationId: string | undefined;

    if (dto.action === SwipeAction.LIKE || dto.action === SwipeAction.SUPERLIKE) {
      const mutualSwipe = await this.swipeModel.findOne({
        swiperId: targetObjectId,
        targetId: userObjectId,
        action: { $in: [SwipeAction.LIKE, SwipeAction.SUPERLIKE] },
        isRewound: false,
      });

      if (mutualSwipe) {
        // Eşleşme oluştur
        const match = await this.createMatch(
          userId,
          dto.targetId,
          dto.action === SwipeAction.SUPERLIKE,
          dto.action === SwipeAction.SUPERLIKE ? userId : undefined,
        );

        isMatch = true;
        matchId = match._id.toString();
        conversationId = match.conversationId?.toString();

        // Eşleşme event'i yayınla
        await this.publisher.publishMatchCreated(
          matchId,
          userId,
          dto.targetId,
          dto.action === SwipeAction.SUPERLIKE,
        );
      } else {
        // Swipe bildirimi yayınla (karşı tarafa)
        if (dto.action === SwipeAction.SUPERLIKE) {
          await this.publisher.publishSuperLikeReceived(dto.targetId, userId);
        }
      }

      // İstatistikleri güncelle
      await this.updateSwipeStats(userId, dto.targetId, dto.action);
    }

    // Kalan hakları hesapla
    const limits = await this.getRemainingLimits(userId);

    this.logger.log(
      `Swipe tamamlandı: ${userId} -> ${dto.targetId} (${dto.action})${isMatch ? ' - MATCH!' : ''}`,
    );

    return {
      success: true,
      isMatch,
      matchId,
      conversationId,
      remainingLikes: limits.remainingLikes,
      remainingSuperLikes: limits.remainingSuperLikes,
    };
  }

  /**
   * Son swipe'ı geri alır (Rewind - Premium özellik)
   */
  async rewind(userId: string): Promise<RewindResultDto> {
    this.logger.debug(`Rewind işlemi: ${userId}`);

    // Premium kontrolü
    // TODO: User service'den premium durumu kontrol edilecek
    const isPremium = false; // Placeholder

    if (!isPremium) {
      throw new ForbiddenException('Rewind özelliği Premium üyelere özeldir');
    }

    // Son swipe'ı bul
    const lastSwipe = await this.swipeModel
      .findOne({ swiperId: new Types.ObjectId(userId), isRewound: false })
      .sort({ swipedAt: -1 });

    if (!lastSwipe) {
      return {
        success: false,
        error: 'Geri alınacak swipe bulunamadı',
        remainingRewinds: 0,
      };
    }

    // 24 saat içinde mi kontrolü
    const hoursSinceSwipe =
      (Date.now() - lastSwipe.swipedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceSwipe > 24) {
      return {
        success: false,
        error: 'Swipe 24 saatten eski, geri alınamaz',
        remainingRewinds: 0,
      };
    }

    // Swipe'ı geri al (soft delete)
    lastSwipe.isRewound = true;
    await lastSwipe.save();

    // Eğer match varsa, onu da iptal et
    const sortedUsers = [userId, lastSwipe.targetId.toString()].sort();
    await this.matchModel.updateOne(
      {
        users: sortedUsers.map((id) => new Types.ObjectId(id)),
        status: MatchStatus.ACTIVE,
      },
      {
        $set: {
          status: MatchStatus.UNMATCHED,
          unmatchedBy: new Types.ObjectId(userId),
          unmatchedAt: new Date(),
        },
      },
    );

    this.logger.log(`Rewind tamamlandı: ${userId}`);

    return {
      success: true,
      rewindedSwipe: {
        targetId: lastSwipe.targetId.toString(),
        action: lastSwipe.action,
        swipedAt: lastSwipe.swipedAt,
      },
      remainingRewinds: -1, // Premium için sınırsız
    };
  }

  /**
   * Kullanıcıyı beğenen profilleri getirir (Premium özellik)
   */
  async getLikesReceived(
    userId: string,
    cursor?: string,
    limit: number = 20,
  ) {
    this.logger.debug(`Beni beğenenler: ${userId}`);

    // Premium kontrolü
    // TODO: User service'den premium durumu kontrol edilecek
    const isPremium = false; // Placeholder

    const query: any = {
      targetId: new Types.ObjectId(userId),
      action: { $in: [SwipeAction.LIKE, SwipeAction.SUPERLIKE] },
      isRewound: false,
    };

    // Cursor bazlı pagination
    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const swipes = await this.swipeModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('swiperId', 'displayName avatar')
      .lean();

    const hasMore = swipes.length > limit;
    if (hasMore) {
      swipes.pop();
    }

    // Premium değilse profilleri blur/gizle
    const likes = swipes.map((swipe: any) => ({
      id: swipe._id.toString(),
      user: isPremium
        ? {
            userId: swipe.swiperId._id.toString(),
            displayName: swipe.swiperId.displayName,
            avatar: swipe.swiperId.avatar,
          }
        : {
            userId: 'hidden',
            displayName: 'Premium üyelikle görüntüle',
            avatar: null,
            isBlurred: true,
          },
      action: swipe.action,
      likedAt: swipe.createdAt,
    }));

    return {
      likes,
      pagination: {
        hasMore,
        nextCursor: hasMore ? swipes[swipes.length - 1]._id.toString() : null,
      },
      isPremiumRequired: !isPremium,
    };
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Swipe limitlerini kontrol eder
   */
  private async checkSwipeLimits(
    userId: string,
    action: SwipeAction,
  ): Promise<void> {
    const limits = await this.getRemainingLimits(userId);

    if (action === SwipeAction.LIKE) {
      if (limits.remainingLikes <= 0) {
        throw new ForbiddenException(
          'Günlük like limitinize ulaştınız. Premium ile sınırsız like yapabilirsiniz.',
        );
      }
    } else if (action === SwipeAction.SUPERLIKE) {
      if (limits.remainingSuperLikes <= 0) {
        throw new ForbiddenException(
          'Günlük super like limitinize ulaştınız.',
        );
      }
    }
  }

  /**
   * Kalan swipe haklarını hesaplar
   */
  private async getRemainingLimits(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Bugünkü swipe sayıları
    const [likeCount, superLikeCount] = await Promise.all([
      this.swipeModel.countDocuments({
        swiperId: new Types.ObjectId(userId),
        action: SwipeAction.LIKE,
        swipedAt: { $gte: startOfDay },
        isRewound: false,
      }),
      this.swipeModel.countDocuments({
        swiperId: new Types.ObjectId(userId),
        action: SwipeAction.SUPERLIKE,
        swipedAt: { $gte: startOfDay },
        isRewound: false,
      }),
    ]);

    // TODO: Premium durumuna göre limitler belirlenecek
    const isPremium = false;
    const dailyLikeLimit = isPremium
      ? -1
      : this.configService.get<number>('dating.swipe.freeDailyLimit') || 50;
    const dailySuperLikeLimit = isPremium
      ? this.configService.get<number>('dating.swipe.superLikePremiumDaily') || 5
      : this.configService.get<number>('dating.swipe.superLikeFreeDaily') || 1;

    return {
      remainingLikes: dailyLikeLimit === -1 ? -1 : dailyLikeLimit - likeCount,
      remainingSuperLikes: dailySuperLikeLimit - superLikeCount,
      isPremium,
    };
  }

  /**
   * Eşleşme kaydı oluşturur
   */
  private async createMatch(
    userId1: string,
    userId2: string,
    wasSuperLike: boolean = false,
    superLikeBy?: string,
  ): Promise<Match> {
    // Kullanıcı ID'lerini sırala
    const sortedUsers = [userId1, userId2]
      .sort()
      .map((id) => new Types.ObjectId(id));

    // TODO: Message service'den conversation oluştur
    const conversationId = new Types.ObjectId(); // Placeholder

    const match = new this.matchModel({
      users: sortedUsers,
      conversationId,
      status: MatchStatus.ACTIVE,
      matchedAt: new Date(),
      wasSuperLike,
      superLikeBy: superLikeBy ? new Types.ObjectId(superLikeBy) : undefined,
    });

    await match.save();

    // Profil istatistiklerini güncelle
    await this.profileModel.updateMany(
      { userId: { $in: sortedUsers } },
      { $inc: { 'stats.matchesCount': 1 } },
    );

    return match;
  }

  /**
   * Swipe sonrası istatistikleri günceller
   */
  private async updateSwipeStats(
    swiperId: string,
    targetId: string,
    action: SwipeAction,
  ): Promise<void> {
    if (action === SwipeAction.PASS) return;

    // Swipe yapanın "likesSent" sayısını artır
    await this.profileModel.updateOne(
      { userId: new Types.ObjectId(swiperId) },
      { $inc: { 'stats.likesSent': 1 } },
    );

    // Hedefin "likesReceived" sayısını artır
    await this.profileModel.updateOne(
      { userId: new Types.ObjectId(targetId) },
      { $inc: { 'stats.likesReceived': 1 } },
    );
  }
}
