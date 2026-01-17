import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserKeys, UserKeysDocument } from '../schemas/user-keys.schema';
import { CreateKeyDto, KeyResponseDto, UserKeysDto } from '../dto/create-key.dto';
import { RedisService } from '@superapp/shared-database';
import { LoggerService } from '@superapp/shared-logger';

@Injectable()
export class KeysService {
  constructor(
    @InjectModel(UserKeys.name) private keysModel: Model<UserKeysDocument>,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Public key oluştur veya güncelle
   */
  async createOrUpdate(userId: string, dto: CreateKeyDto): Promise<KeyResponseDto> {
    // Aynı deviceId ile var mı kontrol et
    const existingKey = await this.keysModel
      .findOne({
        userId: new Types.ObjectId(userId),
        deviceId: dto.deviceId,
      })
      .exec();

    let key: UserKeysDocument;

    if (existingKey) {
      // Güncelle
      existingKey.publicKey = dto.publicKey;
      existingKey.deviceName = dto.deviceName;
      existingKey.platform = dto.platform;
      existingKey.isActive = true;
      existingKey.lastUsedAt = new Date();
      await existingKey.save();
      key = existingKey;

      this.logger.log(`Key güncellendi: ${userId} - ${dto.deviceId}`, 'KeysService');
    } else {
      // Yeni oluştur
      key = new this.keysModel({
        userId: new Types.ObjectId(userId),
        publicKey: dto.publicKey,
        deviceId: dto.deviceId,
        deviceName: dto.deviceName,
        platform: dto.platform,
        isActive: true,
      });
      await key.save();

      this.logger.log(`Yeni key oluşturuldu: ${userId} - ${dto.deviceId}`, 'KeysService');
    }

    // Cache invalidate
    await this.redisService.del(`pubkey:${userId}`);

    return {
      id: key._id.toString(),
      deviceId: key.deviceId,
      deviceName: key.deviceName,
      platform: key.platform as 'ios' | 'android' | 'web' | undefined,
      isActive: key.isActive,
      createdAt: key.createdAt,
    };
  }

  /**
   * Kullanıcının public keylerini getir
   */
  async getByUserId(userId: string): Promise<UserKeysDto[]> {
    // Cache kontrol
    const cacheKey = `pubkey:${userId}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const keys = await this.keysModel
      .find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      })
      .select('publicKey deviceId deviceName isActive')
      .exec();

    const result: UserKeysDto[] = keys.map((key) => ({
      publicKey: key.publicKey,
      deviceId: key.deviceId,
      deviceName: key.deviceName,
      isActive: key.isActive,
    }));

    // Cache'e kaydet (1 saat)
    await this.redisService.setex(cacheKey, 3600, JSON.stringify(result));

    return result;
  }

  /**
   * Belirli bir cihazın keyini getir
   */
  async getByDeviceId(userId: string, deviceId: string): Promise<UserKeysDocument | null> {
    return this.keysModel
      .findOne({
        userId: new Types.ObjectId(userId),
        deviceId,
        isActive: true,
      })
      .exec();
  }

  /**
   * Key'i deaktive et
   */
  async deactivate(userId: string, deviceId: string): Promise<void> {
    await this.keysModel
      .updateOne(
        {
          userId: new Types.ObjectId(userId),
          deviceId,
        },
        { $set: { isActive: false } },
      )
      .exec();

    // Cache invalidate
    await this.redisService.del(`pubkey:${userId}`);

    this.logger.log(`Key deaktive edildi: ${userId} - ${deviceId}`, 'KeysService');
  }

  /**
   * Tüm keyleri deaktive et (logout all)
   */
  async deactivateAll(userId: string): Promise<void> {
    await this.keysModel
      .updateMany({ userId: new Types.ObjectId(userId) }, { $set: { isActive: false } })
      .exec();

    // Cache invalidate
    await this.redisService.del(`pubkey:${userId}`);

    this.logger.log(`Tüm keyler deaktive edildi: ${userId}`, 'KeysService');
  }

  /**
   * Son kullanım zamanını güncelle
   */
  async updateLastUsed(userId: string, deviceId: string): Promise<void> {
    await this.keysModel
      .updateOne(
        {
          userId: new Types.ObjectId(userId),
          deviceId,
        },
        { $set: { lastUsedAt: new Date() } },
      )
      .exec();
  }

  /**
   * Kullanıcının aktif key sayısını getir
   */
  async getActiveKeyCount(userId: string): Promise<number> {
    return this.keysModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        isActive: true,
      })
      .exec();
  }
}
