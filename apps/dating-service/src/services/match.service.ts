import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match, MatchStatus } from '../schemas/match.schema';
import { DatingProfile } from '../schemas/dating-profile.schema';
import {
  MatchResponseDto,
  MatchListResponseDto,
  MatchStatsDto,
  UnmatchResultDto,
} from '../dto/match-response.dto';
import { DatingPublisher } from '../events/dating.publisher';

/**
 * MatchService
 * Eşleşmeleri (matches) yönetir
 */
@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(
    @InjectModel(Match.name)
    private readonly matchModel: Model<Match>,
    @InjectModel(DatingProfile.name)
    private readonly profileModel: Model<DatingProfile>,
    private readonly publisher: DatingPublisher,
  ) {}

  /**
   * Kullanıcının eşleşmelerini getirir
   */
  async getMatches(
    userId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<MatchListResponseDto> {
    this.logger.debug(`Eşleşmeler getiriliyor: ${userId}`);

    const userObjectId = new Types.ObjectId(userId);

    const query: any = {
      users: userObjectId,
      status: MatchStatus.ACTIVE,
    };

    // Cursor bazlı pagination
    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    // Eşleşmeleri getir
    const matches = await this.matchModel
      .find(query)
      .sort({ matchedAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = matches.length > limit;
    if (hasMore) {
      matches.pop();
    }

    // Eşleşilen kullanıcıların bilgilerini getir
    const matchResponses: MatchResponseDto[] = await Promise.all(
      matches.map(async (match) => {
        const otherUserId = match.users.find(
          (id: Types.ObjectId) => id.toString() !== userId,
        );

        // Karşı tarafın profil bilgilerini getir
        const otherProfile = await this.profileModel
          .findOne({ userId: otherUserId })
          .lean();

        // TODO: User service'den kullanıcı bilgilerini al
        // TODO: Message service'den son mesaj bilgisini al

        return {
          id: match._id.toString(),
          user: {
            userId: otherUserId!.toString(),
            displayName: otherProfile?.bio?.substring(0, 20) || 'Kullanıcı',
            age: undefined, // User service'den alınacak
            avatar: otherProfile?.photos?.[0]?.url || '',
            bio: otherProfile?.bio?.substring(0, 100),
            isVerified: otherProfile?.photoVerified || false,
            isOnline: false, // Real-time service'den alınacak
            lastSeenAt: undefined,
          },
          conversationId: match.conversationId.toString(),
          status: match.status,
          matchedAt: match.matchedAt,
          lastMessage: undefined, // Message service'den alınacak
          unreadCount: 0, // Message service'den alınacak
        };
      }),
    );

    return {
      success: true,
      data: matchResponses,
      pagination: {
        hasMore,
        nextCursor: hasMore
          ? matches[matches.length - 1]._id.toString()
          : undefined,
        total: await this.getActiveMatchCount(userId),
      },
    };
  }

  /**
   * Tek bir eşleşmeyi getirir
   */
  async getMatch(userId: string, matchId: string): Promise<MatchResponseDto> {
    const match = await this.matchModel.findById(matchId).lean();

    if (!match) {
      throw new NotFoundException('Eşleşme bulunamadı');
    }

    // Kullanıcının bu eşleşmede olup olmadığını kontrol et
    const isParticipant = match.users.some(
      (id: Types.ObjectId) => id.toString() === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('Bu eşleşmeye erişim yetkiniz yok');
    }

    const otherUserId = match.users.find(
      (id: Types.ObjectId) => id.toString() !== userId,
    );

    const otherProfile = await this.profileModel
      .findOne({ userId: otherUserId })
      .lean();

    return {
      id: match._id.toString(),
      user: {
        userId: otherUserId!.toString(),
        displayName: otherProfile?.bio?.substring(0, 20) || 'Kullanıcı',
        age: undefined,
        avatar: otherProfile?.photos?.[0]?.url || '',
        bio: otherProfile?.bio?.substring(0, 100),
        isVerified: otherProfile?.photoVerified || false,
      },
      conversationId: match.conversationId.toString(),
      status: match.status,
      matchedAt: match.matchedAt,
    };
  }

  /**
   * Eşleşmeyi kaldırır (unmatch)
   */
  async unmatch(userId: string, matchId: string): Promise<UnmatchResultDto> {
    this.logger.debug(`Unmatch işlemi: ${userId} - ${matchId}`);

    const match = await this.matchModel.findById(matchId);

    if (!match) {
      throw new NotFoundException('Eşleşme bulunamadı');
    }

    // Kullanıcının bu eşleşmede olup olmadığını kontrol et
    const isParticipant = match.users.some(
      (id: Types.ObjectId) => id.toString() === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('Bu eşleşmeyi kaldırma yetkiniz yok');
    }

    // Zaten unmatch edilmiş mi?
    if (match.status === MatchStatus.UNMATCHED) {
      return {
        success: true,
        error: 'Bu eşleşme zaten kaldırılmış',
      };
    }

    // Eşleşmeyi kaldır
    match.status = MatchStatus.UNMATCHED;
    match.unmatchedBy = new Types.ObjectId(userId);
    match.unmatchedAt = new Date();
    await match.save();

    // Profil istatistiklerini güncelle
    await this.profileModel.updateMany(
      { userId: { $in: match.users } },
      { $inc: { 'stats.matchesCount': -1 } },
    );

    // Event yayınla
    const otherUserId = match.users.find(
      (id: Types.ObjectId) => id.toString() !== userId,
    );
    await this.publisher.publishUnmatch(
      matchId,
      userId,
      otherUserId!.toString(),
    );

    this.logger.log(`Unmatch tamamlandı: ${matchId}`);

    return {
      success: true,
    };
  }

  /**
   * Eşleşme istatistiklerini getirir
   */
  async getMatchStats(userId: string): Promise<MatchStatsDto> {
    const userObjectId = new Types.ObjectId(userId);

    // Bu haftanın başlangıcı
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [totalMatches, activeMatches, matchesThisWeek, superLikeMatches] =
      await Promise.all([
        // Toplam eşleşme
        this.matchModel.countDocuments({ users: userObjectId }),
        // Aktif eşleşme
        this.matchModel.countDocuments({
          users: userObjectId,
          status: MatchStatus.ACTIVE,
        }),
        // Bu hafta eşleşme
        this.matchModel.countDocuments({
          users: userObjectId,
          matchedAt: { $gte: startOfWeek },
        }),
        // Super like ile eşleşme
        this.matchModel.countDocuments({
          users: userObjectId,
          wasSuperLike: true,
        }),
      ]);

    // TODO: Message service'den mesajlaşılan eşleşme sayısı alınacak
    const conversationsStarted = 0;

    return {
      totalMatches,
      activeMatches,
      matchesThisWeek,
      superLikeMatches,
      conversationsStarted,
    };
  }

  /**
   * İki kullanıcının eşleşip eşleşmediğini kontrol eder
   */
  async checkMatch(userId1: string, userId2: string): Promise<Match | null> {
    const sortedUsers = [userId1, userId2]
      .sort()
      .map((id) => new Types.ObjectId(id));

    return this.matchModel
      .findOne({
        users: sortedUsers,
        status: MatchStatus.ACTIVE,
      })
      .lean();
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Aktif eşleşme sayısını getirir
   */
  private async getActiveMatchCount(userId: string): Promise<number> {
    return this.matchModel.countDocuments({
      users: new Types.ObjectId(userId),
      status: MatchStatus.ACTIVE,
    });
  }
}
