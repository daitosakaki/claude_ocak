import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Follow, FollowDocument } from '../schemas/follow.schema';
import { FollowersQueryDto, PaginatedResponseDto } from '../dto/user-query.dto';
import { UserSummaryDto, FollowResultDto } from '../dto/user-response.dto';
import { RedisService } from '@superapp/shared-database';
import { LoggerService } from '@superapp/shared-logger';
import { UserPublisher } from '../events/user.publisher';

@Injectable()
export class FollowService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
    private readonly userPublisher: UserPublisher,
  ) {}

  /**
   * Kullanıcıyı takip et
   */
  async follow(followerId: string, followingId: string): Promise<FollowResultDto> {
    // Kendini takip edemez
    if (followerId === followingId) {
      throw new BadRequestException('Kendinizi takip edemezsiniz');
    }

    // Takip edilecek kullanıcıyı kontrol et
    const targetUser = await this.userModel.findById(followingId).exec();
    if (!targetUser || targetUser.status !== 'active') {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Zaten takip ediyor mu?
    const existingFollow = await this.followModel
      .findOne({
        followerId: new Types.ObjectId(followerId),
        followingId: new Types.ObjectId(followingId),
      })
      .exec();

    if (existingFollow) {
      if (existingFollow.status === 'active') {
        throw new ConflictException('Bu kullanıcıyı zaten takip ediyorsunuz');
      }
      if (existingFollow.status === 'pending') {
        throw new ConflictException('Takip isteği zaten gönderilmiş');
      }
    }

    // Takip durumu: gizli hesapsa pending, değilse active
    const status = targetUser.isPrivate ? 'pending' : 'active';

    // Takip oluştur
    const follow = new this.followModel({
      followerId: new Types.ObjectId(followerId),
      followingId: new Types.ObjectId(followingId),
      status,
    });
    await follow.save();

    // İstatistikleri güncelle (sadece active ise)
    if (status === 'active') {
      await Promise.all([
        this.userModel.updateOne(
          { _id: followerId },
          { $inc: { 'stats.followingCount': 1 } },
        ),
        this.userModel.updateOne(
          { _id: followingId },
          { $inc: { 'stats.followersCount': 1 } },
        ),
      ]);

      // Cache invalidate
      await this.invalidateFollowCache(followerId, followingId);
    }

    // Event yayınla
    await this.userPublisher.publishUserFollowed({
      followerId,
      followingId,
      status,
    });

    this.logger.log(
      `Takip: ${followerId} -> ${followingId} (${status})`,
      'FollowService',
    );

    return { status: status as 'following' | 'pending' };
  }

  /**
   * Takibi bırak
   */
  async unfollow(followerId: string, followingId: string): Promise<void> {
    const follow = await this.followModel
      .findOneAndDelete({
        followerId: new Types.ObjectId(followerId),
        followingId: new Types.ObjectId(followingId),
      })
      .exec();

    if (!follow) {
      throw new NotFoundException('Takip bulunamadı');
    }

    // İstatistikleri güncelle (sadece active idiyse)
    if (follow.status === 'active') {
      await Promise.all([
        this.userModel.updateOne(
          { _id: followerId },
          { $inc: { 'stats.followingCount': -1 } },
        ),
        this.userModel.updateOne(
          { _id: followingId },
          { $inc: { 'stats.followersCount': -1 } },
        ),
      ]);
    }

    // Cache invalidate
    await this.invalidateFollowCache(followerId, followingId);

    // Event yayınla
    await this.userPublisher.publishUserUnfollowed({
      followerId,
      followingId,
    });

    this.logger.log(`Takip bırakıldı: ${followerId} -> ${followingId}`, 'FollowService');
  }

  /**
   * Takipçileri getir
   */
  async getFollowers(
    userId: string,
    query: FollowersQueryDto,
    currentUserId?: string,
  ): Promise<PaginatedResponseDto<UserSummaryDto>> {
    const { cursor, limit = 20 } = query;

    // Sorgu oluştur
    const mongoQuery: Record<string, unknown> = {
      followingId: new Types.ObjectId(userId),
      status: 'active',
    };

    if (cursor) {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
      mongoQuery._id = { $lt: new Types.ObjectId(decoded.id) };
    }

    // Takipçileri getir
    const follows = await this.followModel
      .find(mongoQuery)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;

    // Kullanıcı bilgilerini getir
    const followerIds = items.map((f) => f.followerId);
    const users = await this.userModel
      .find({ _id: { $in: followerIds } })
      .select('username displayName avatar isVerified')
      .exec();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Takip durumlarını kontrol et
    let followingSet = new Set<string>();
    let followedBySet = new Set<string>();

    if (currentUserId) {
      const [following, followedBy] = await Promise.all([
        this.followModel
          .find({
            followerId: new Types.ObjectId(currentUserId),
            followingId: { $in: followerIds },
            status: 'active',
          })
          .select('followingId')
          .exec(),
        this.followModel
          .find({
            followerId: { $in: followerIds },
            followingId: new Types.ObjectId(currentUserId),
            status: 'active',
          })
          .select('followerId')
          .exec(),
      ]);

      followingSet = new Set(following.map((f) => f.followingId.toString()));
      followedBySet = new Set(followedBy.map((f) => f.followerId.toString()));
    }

    // Sonuçları oluştur
    const data: UserSummaryDto[] = items.map((follow) => {
      const user = userMap.get(follow.followerId.toString());
      return {
        id: follow.followerId.toString(),
        username: user?.username || '',
        displayName: user?.displayName || '',
        avatar: user?.avatar,
        isVerified: user?.isVerified || false,
        isFollowing: followingSet.has(follow.followerId.toString()),
        isFollowedBy: followedBySet.has(follow.followerId.toString()),
      };
    });

    // Cursor oluştur
    let nextCursor: string | undefined;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ id: lastItem._id })).toString('base64');
    }

    return {
      data,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  }

  /**
   * Takip edilenleri getir
   */
  async getFollowing(
    userId: string,
    query: FollowersQueryDto,
    currentUserId?: string,
  ): Promise<PaginatedResponseDto<UserSummaryDto>> {
    const { cursor, limit = 20 } = query;

    // Sorgu oluştur
    const mongoQuery: Record<string, unknown> = {
      followerId: new Types.ObjectId(userId),
      status: 'active',
    };

    if (cursor) {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
      mongoQuery._id = { $lt: new Types.ObjectId(decoded.id) };
    }

    // Takip edilenleri getir
    const follows = await this.followModel
      .find(mongoQuery)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;

    // Kullanıcı bilgilerini getir
    const followingIds = items.map((f) => f.followingId);
    const users = await this.userModel
      .find({ _id: { $in: followingIds } })
      .select('username displayName avatar isVerified')
      .exec();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Takip durumlarını kontrol et
    let followingSet = new Set<string>();
    let followedBySet = new Set<string>();

    if (currentUserId) {
      const [following, followedBy] = await Promise.all([
        this.followModel
          .find({
            followerId: new Types.ObjectId(currentUserId),
            followingId: { $in: followingIds },
            status: 'active',
          })
          .select('followingId')
          .exec(),
        this.followModel
          .find({
            followerId: { $in: followingIds },
            followingId: new Types.ObjectId(currentUserId),
            status: 'active',
          })
          .select('followerId')
          .exec(),
      ]);

      followingSet = new Set(following.map((f) => f.followingId.toString()));
      followedBySet = new Set(followedBy.map((f) => f.followerId.toString()));
    }

    // Sonuçları oluştur
    const data: UserSummaryDto[] = items.map((follow) => {
      const user = userMap.get(follow.followingId.toString());
      return {
        id: follow.followingId.toString(),
        username: user?.username || '',
        displayName: user?.displayName || '',
        avatar: user?.avatar,
        isVerified: user?.isVerified || false,
        isFollowing: followingSet.has(follow.followingId.toString()),
        isFollowedBy: followedBySet.has(follow.followingId.toString()),
      };
    });

    // Cursor oluştur
    let nextCursor: string | undefined;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ id: lastItem._id })).toString('base64');
    }

    return {
      data,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  }

  /**
   * Takip edip etmediğini kontrol et
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.followModel
      .findOne({
        followerId: new Types.ObjectId(followerId),
        followingId: new Types.ObjectId(followingId),
        status: 'active',
      })
      .exec();
    return !!follow;
  }

  /**
   * Takip cache'ini temizle
   */
  private async invalidateFollowCache(
    followerId: string,
    followingId: string,
  ): Promise<void> {
    await Promise.all([
      this.redisService.del(`following:${followerId}`),
      this.redisService.del(`followers:${followingId}`),
      this.redisService.del(`user:${followerId}`),
      this.redisService.del(`user:${followingId}`),
    ]);
  }
}
