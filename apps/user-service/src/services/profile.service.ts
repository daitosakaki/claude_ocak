import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Follow, FollowDocument } from '../schemas/follow.schema';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { RedisService } from '@superapp/shared-database';
import { LoggerService } from '@superapp/shared-logger';
import { UserPublisher } from '../events/user.publisher';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
    private readonly userPublisher: UserPublisher,
  ) {}

  /**
   * ID ile kullanıcı getir
   */
  async getById(userId: string, currentUserId?: string): Promise<UserDocument> {
    // Cache kontrol
    const cacheKey = `user:${userId}`;
    const cached = await this.redisService.get(cacheKey);

    let user: UserDocument | null;

    if (cached) {
      user = JSON.parse(cached);
    } else {
      user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      // Aktif değilse hata
      if (user.status !== 'active') {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      // Cache'e kaydet (5 dakika)
      await this.redisService.setex(cacheKey, 300, JSON.stringify(user));
    }

    // İlişki durumlarını ekle
    if (currentUserId && currentUserId !== userId) {
      const [isFollowing, isFollowedBy, isBlocked] = await Promise.all([
        this.checkFollowing(currentUserId, userId),
        this.checkFollowing(userId, currentUserId),
        this.checkBlocked(currentUserId, userId),
      ]);

      return {
        ...user.toObject(),
        isFollowing,
        isFollowedBy,
        isBlocked,
      } as UserDocument;
    }

    return user;
  }

  /**
   * Kullanıcı adı ile kullanıcı getir
   */
  async getByUsername(username: string, currentUserId?: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ username: username.toLowerCase(), status: 'active' })
      .exec();

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // İlişki durumlarını ekle
    if (currentUserId && currentUserId !== user._id.toString()) {
      const [isFollowing, isFollowedBy, isBlocked] = await Promise.all([
        this.checkFollowing(currentUserId, user._id.toString()),
        this.checkFollowing(user._id.toString(), currentUserId),
        this.checkBlocked(currentUserId, user._id.toString()),
      ]);

      return {
        ...user.toObject(),
        isFollowing,
        isFollowedBy,
        isBlocked,
      } as UserDocument;
    }

    return user;
  }

  /**
   * Profil güncelle
   */
  async update(userId: string, dto: UpdateProfileDto): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Kullanıcı adı değişikliği kontrolü
    if (dto.username && dto.username !== user.username) {
      const existing = await this.userModel
        .findOne({
          username: dto.username.toLowerCase(),
          _id: { $ne: userId },
        })
        .exec();

      if (existing) {
        throw new ConflictException('Bu kullanıcı adı zaten kullanılıyor');
      }

      dto.username = dto.username.toLowerCase();
    }

    // Güncelle
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { ...dto, updatedAt: new Date() } },
        { new: true },
      )
      .exec();

    // Cache invalidate
    await this.redisService.del(`user:${userId}`);

    // Event yayınla
    await this.userPublisher.publishUserUpdated({
      userId,
      changes: Object.keys(dto),
    });

    this.logger.log(`Profil güncellendi: ${userId}`, 'ProfileService');

    return updatedUser!;
  }

  /**
   * Takip durumu kontrol
   */
  private async checkFollowing(followerId: string, followingId: string): Promise<boolean> {
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
   * Engel durumu kontrol
   */
  private async checkBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    // messaging_settings collection'ından kontrol edilecek
    // Şimdilik false dönüyoruz
    return false;
  }
}
