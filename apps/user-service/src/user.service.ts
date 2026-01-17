import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Follow, FollowDocument } from './schemas/follow.schema';
import { RedisService } from '@superapp/shared-database';
import { LoggerService } from '@superapp/shared-logger';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * ID ile kullanıcı getir
   */
  async findById(userId: string): Promise<UserDocument | null> {
    // Cache kontrol
    const cacheKey = `user:${userId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const user = await this.userModel.findById(userId).exec();
    if (user) {
      // Cache'e kaydet (5 dakika)
      await this.redisService.setex(cacheKey, 300, JSON.stringify(user));
    }

    return user;
  }

  /**
   * Kullanıcı adı ile kullanıcı getir
   */
  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username: username.toLowerCase() }).exec();
  }

  /**
   * Email ile kullanıcı getir
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * Kullanıcı ara
   */
  async search(
    query: string,
    limit: number = 20,
    currentUserId?: string,
  ): Promise<UserDocument[]> {
    const users = await this.userModel
      .find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { displayName: { $regex: query, $options: 'i' } },
        ],
        status: 'active',
      })
      .select('username displayName avatar isVerified')
      .limit(limit)
      .exec();

    // Takip durumlarını ekle
    if (currentUserId && users.length > 0) {
      const userIds = users.map((u) => u._id);
      const followings = await this.followModel
        .find({
          followerId: new Types.ObjectId(currentUserId),
          followingId: { $in: userIds },
          status: 'active',
        })
        .select('followingId')
        .exec();

      const followingSet = new Set(followings.map((f) => f.followingId.toString()));

      return users.map((user) => ({
        ...user.toObject(),
        isFollowing: followingSet.has(user._id.toString()),
      })) as UserDocument[];
    }

    return users;
  }

  /**
   * Kullanıcı var mı kontrol et
   */
  async exists(userId: string): Promise<boolean> {
    const count = await this.userModel.countDocuments({ _id: userId }).exec();
    return count > 0;
  }

  /**
   * Kullanıcı adı müsait mi
   */
  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const query: Record<string, unknown> = { username: username.toLowerCase() };
    if (excludeUserId) {
      query._id = { $ne: new Types.ObjectId(excludeUserId) };
    }
    const count = await this.userModel.countDocuments(query).exec();
    return count === 0;
  }

  /**
   * Kullanıcı istatistiklerini güncelle
   */
  async updateStats(
    userId: string,
    field: 'postsCount' | 'followersCount' | 'followingCount' | 'likesCount',
    increment: number,
  ): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId },
        { $inc: { [`stats.${field}`]: increment }, $set: { updatedAt: new Date() } },
      )
      .exec();

    // Cache invalidate
    await this.redisService.del(`user:${userId}`);
  }

  /**
   * Son görülme zamanını güncelle
   */
  async updateLastSeen(userId: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { $set: { lastSeenAt: new Date() } })
      .exec();
  }

  /**
   * FCM token ekle
   */
  async addFcmToken(
    userId: string,
    token: string,
    deviceId: string,
    platform: 'ios' | 'android' | 'web',
  ): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId },
        {
          $pull: { fcmTokens: { deviceId } }, // Eski token'ı sil
        },
      )
      .exec();

    await this.userModel
      .updateOne(
        { _id: userId },
        {
          $push: {
            fcmTokens: {
              token,
              deviceId,
              platform,
              createdAt: new Date(),
            },
          },
        },
      )
      .exec();

    this.logger.log(`FCM token eklendi: ${userId}`, 'UserService');
  }

  /**
   * FCM token sil
   */
  async removeFcmToken(userId: string, deviceId: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { $pull: { fcmTokens: { deviceId } } })
      .exec();
  }

  /**
   * Kullanıcının FCM tokenlarını getir
   */
  async getFcmTokens(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).select('fcmTokens').exec();
    return user?.fcmTokens?.map((t) => t.token) || [];
  }

  /**
   * Cache'i temizle
   */
  async invalidateCache(userId: string): Promise<void> {
    await this.redisService.del(`user:${userId}`);
    await this.redisService.del(`user:${userId}:settings`);
    await this.redisService.del(`following:${userId}`);
    await this.redisService.del(`followers:${userId}`);
  }
}
