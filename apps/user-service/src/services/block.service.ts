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
import { BlockedUserDto } from '../dto/user-response.dto';
import { RedisService } from '@superapp/shared-database';
import { LoggerService } from '@superapp/shared-logger';
import { UserPublisher } from '../events/user.publisher';

// Block bilgisi için ayrı bir subdocument
// Şimdilik User schema'sına veya messaging_settings'e eklenebilir
// Bu örnek için memory'de tutacağız, gerçek implementasyonda collection gerekli

interface BlockRecord {
  blockerId: string;
  blockedId: string;
  blockedAt: Date;
}

@Injectable()
export class BlockService {
  // Gerçek implementasyonda MongoDB collection kullanılacak
  // Şimdilik basit bir Map kullanıyoruz
  private blocks: Map<string, BlockRecord[]> = new Map();

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
    private readonly userPublisher: UserPublisher,
  ) {}

  /**
   * Kullanıcıyı engelle
   */
  async block(blockerId: string, blockedId: string): Promise<void> {
    // Kendini engelleyemez
    if (blockerId === blockedId) {
      throw new BadRequestException('Kendinizi engelleyemezsiniz');
    }

    // Engellenecek kullanıcıyı kontrol et
    const targetUser = await this.userModel.findById(blockedId).exec();
    if (!targetUser || targetUser.status !== 'active') {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Zaten engellenmiş mi?
    const isBlocked = await this.isBlocked(blockerId, blockedId);
    if (isBlocked) {
      throw new ConflictException('Bu kullanıcı zaten engellenmiş');
    }

    // Engel kaydı oluştur
    const blockerBlocks = this.blocks.get(blockerId) || [];
    blockerBlocks.push({
      blockerId,
      blockedId,
      blockedAt: new Date(),
    });
    this.blocks.set(blockerId, blockerBlocks);

    // Takip ilişkilerini kaldır (karşılıklı)
    await Promise.all([
      this.followModel.deleteOne({
        followerId: new Types.ObjectId(blockerId),
        followingId: new Types.ObjectId(blockedId),
      }),
      this.followModel.deleteOne({
        followerId: new Types.ObjectId(blockedId),
        followingId: new Types.ObjectId(blockerId),
      }),
    ]);

    // İstatistikleri güncelle
    await Promise.all([
      this.userModel.updateOne(
        { _id: blockerId },
        { $inc: { 'stats.followingCount': -1, 'stats.followersCount': -1 } },
      ),
      this.userModel.updateOne(
        { _id: blockedId },
        { $inc: { 'stats.followingCount': -1, 'stats.followersCount': -1 } },
      ),
    ]);

    // Cache invalidate
    await this.invalidateCache(blockerId, blockedId);

    // Event yayınla
    await this.userPublisher.publishUserBlocked({
      blockerId,
      blockedId,
    });

    this.logger.log(`Engellendi: ${blockerId} -> ${blockedId}`, 'BlockService');
  }

  /**
   * Engeli kaldır
   */
  async unblock(blockerId: string, blockedId: string): Promise<void> {
    const blockerBlocks = this.blocks.get(blockerId) || [];
    const blockIndex = blockerBlocks.findIndex((b) => b.blockedId === blockedId);

    if (blockIndex === -1) {
      throw new NotFoundException('Engel bulunamadı');
    }

    // Engeli kaldır
    blockerBlocks.splice(blockIndex, 1);
    this.blocks.set(blockerId, blockerBlocks);

    // Cache invalidate
    await this.invalidateCache(blockerId, blockedId);

    this.logger.log(`Engel kaldırıldı: ${blockerId} -> ${blockedId}`, 'BlockService');
  }

  /**
   * Engellenen kullanıcıları getir
   */
  async getBlockedUsers(blockerId: string): Promise<BlockedUserDto[]> {
    const blockerBlocks = this.blocks.get(blockerId) || [];

    if (blockerBlocks.length === 0) {
      return [];
    }

    const blockedIds = blockerBlocks.map((b) => new Types.ObjectId(b.blockedId));
    const users = await this.userModel
      .find({ _id: { $in: blockedIds } })
      .select('username displayName avatar')
      .exec();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return blockerBlocks.map((block) => {
      const user = userMap.get(block.blockedId);
      return {
        id: block.blockedId,
        username: user?.username || '',
        displayName: user?.displayName || '',
        avatar: user?.avatar,
        blockedAt: block.blockedAt,
      };
    });
  }

  /**
   * Engel durumunu kontrol et
   */
  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const blockerBlocks = this.blocks.get(blockerId) || [];
    return blockerBlocks.some((b) => b.blockedId === blockedId);
  }

  /**
   * Karşılıklı engel durumunu kontrol et
   * (biri diğerini engellemiş mi?)
   */
  async isBlockedEither(userId1: string, userId2: string): Promise<boolean> {
    const [blocked1, blocked2] = await Promise.all([
      this.isBlocked(userId1, userId2),
      this.isBlocked(userId2, userId1),
    ]);
    return blocked1 || blocked2;
  }

  /**
   * Cache temizle
   */
  private async invalidateCache(blockerId: string, blockedId: string): Promise<void> {
    await Promise.all([
      this.redisService.del(`user:${blockerId}`),
      this.redisService.del(`user:${blockedId}`),
      this.redisService.del(`following:${blockerId}`),
      this.redisService.del(`following:${blockedId}`),
      this.redisService.del(`followers:${blockerId}`),
      this.redisService.del(`followers:${blockedId}`),
    ]);
  }
}
