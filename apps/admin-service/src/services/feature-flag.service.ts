/**
 * Feature Flag Service
 * Özellik bayrakları yönetimi: CRUD, rollout, caching
 */

import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeatureFlag, FeatureFlagDocument } from '../schemas/feature-flag.schema';
import { AdminLog, AdminLogDocument } from '../schemas/admin-log.schema';
import { CreateFeatureFlagDto, UpdateFeatureFlagDto, FeatureFlagResponseDto } from '../dto/feature-flag.dto';
import { AdminAction } from '../dto/admin-log.dto';

// Redis client için basit interface (gerçek implementasyonda ioredis kullanılacak)
interface CacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private readonly CACHE_PREFIX = 'flags:';
  private readonly CACHE_TTL = 60; // 60 saniye

  // Basit in-memory cache (production'da Redis kullanılacak)
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  constructor(
    @InjectModel(FeatureFlag.name) private featureFlagModel: Model<FeatureFlagDocument>,
    @InjectModel(AdminLog.name) private adminLogModel: Model<AdminLogDocument>,
  ) {}

  /**
   * Tüm feature flag'leri getir
   */
  async getFlags(category?: string): Promise<FeatureFlagResponseDto[]> {
    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    const flags = await this.featureFlagModel
      .find(filter)
      .sort({ category: 1, key: 1 })
      .lean()
      .exec();

    return flags.map(this.mapToResponse);
  }

  /**
   * Tek bir flag getir (key ile)
   */
  async getFlagByKey(key: string): Promise<FeatureFlagResponseDto> {
    // Cache kontrol
    const cached = this.getFromCache(key);
    if (cached) {
      return cached;
    }

    const flag = await this.featureFlagModel.findOne({ key }).lean().exec();

    if (!flag) {
      throw new NotFoundException(`Feature flag bulunamadı: ${key}`);
    }

    const response = this.mapToResponse(flag);

    // Cache'e ekle
    this.setToCache(key, response);

    return response;
  }

  /**
   * Yeni feature flag oluştur
   */
  async createFlag(
    dto: CreateFeatureFlagDto,
    adminId: string,
    ip: string,
  ): Promise<FeatureFlagResponseDto> {
    // Key benzersizlik kontrolü
    const existing = await this.featureFlagModel.findOne({ key: dto.key }).exec();
    if (existing) {
      throw new ConflictException(`Bu key zaten kullanımda: ${dto.key}`);
    }

    // Key format kontrolü
    if (!/^[a-z][a-z0-9_]*$/.test(dto.key)) {
      throw new BadRequestException('Key sadece küçük harf, rakam ve alt çizgi içerebilir');
    }

    const flag = await this.featureFlagModel.create({
      ...dto,
      updatedBy: new Types.ObjectId(adminId),
    });

    // Audit log
    await this.createLog(adminId, AdminAction.FLAG_CREATED, 'flag', flag._id.toString(), {
      after: dto,
    }, ip);

    // Cache temizle
    this.invalidateCache(dto.key);
    this.invalidateAllFlagsCache();

    this.logger.log(`Feature flag oluşturuldu: ${dto.key} - Admin: ${adminId}`);

    return this.mapToResponse(flag.toObject());
  }

  /**
   * Feature flag güncelle
   */
  async updateFlag(
    key: string,
    dto: UpdateFeatureFlagDto,
    adminId: string,
    ip: string,
  ): Promise<FeatureFlagResponseDto> {
    const flag = await this.featureFlagModel.findOne({ key }).exec();

    if (!flag) {
      throw new NotFoundException(`Feature flag bulunamadı: ${key}`);
    }

    const before = flag.toObject();

    // Güncellenebilir alanları güncelle
    if (dto.name !== undefined) flag.name = dto.name;
    if (dto.description !== undefined) flag.description = dto.description;
    if (dto.enabled !== undefined) flag.enabled = dto.enabled;
    if (dto.rollout !== undefined) {
      flag.rollout = {
        percentage: dto.rollout.percentage ?? flag.rollout.percentage,
        userIds: dto.rollout.userIds ?? flag.rollout.userIds,
      };
    }
    if (dto.permissions !== undefined) {
      flag.permissions = {
        free: dto.permissions.free ?? flag.permissions.free,
        premium: dto.permissions.premium ?? flag.permissions.premium,
        business: dto.permissions.business ?? flag.permissions.business,
      };
    }
    if (dto.userSetting !== undefined) {
      flag.userSetting = dto.userSetting;
    }
    if (dto.regions !== undefined) flag.regions = dto.regions;
    if (dto.platforms !== undefined) flag.platforms = dto.platforms;

    flag.updatedBy = new Types.ObjectId(adminId);
    await flag.save();

    // Audit log
    await this.createLog(adminId, AdminAction.FLAG_UPDATED, 'flag', flag._id.toString(), {
      before,
      after: flag.toObject(),
    }, ip);

    // Cache temizle
    this.invalidateCache(key);
    this.invalidateAllFlagsCache();

    this.logger.log(`Feature flag güncellendi: ${key} - Admin: ${adminId}`);

    return this.mapToResponse(flag.toObject());
  }

  /**
   * Feature flag sil
   */
  async deleteFlag(key: string, adminId: string, ip: string): Promise<void> {
    const flag = await this.featureFlagModel.findOne({ key }).exec();

    if (!flag) {
      throw new NotFoundException(`Feature flag bulunamadı: ${key}`);
    }

    const flagData = flag.toObject();
    await flag.deleteOne();

    // Audit log
    await this.createLog(adminId, AdminAction.FLAG_DELETED, 'flag', flagData._id.toString(), {
      before: flagData,
    }, ip);

    // Cache temizle
    this.invalidateCache(key);
    this.invalidateAllFlagsCache();

    this.logger.log(`Feature flag silindi: ${key} - Admin: ${adminId}`);
  }

  /**
   * Flag'i hızlıca aç/kapat
   */
  async toggleFlag(key: string, adminId: string, ip: string): Promise<FeatureFlagResponseDto> {
    const flag = await this.featureFlagModel.findOne({ key }).exec();

    if (!flag) {
      throw new NotFoundException(`Feature flag bulunamadı: ${key}`);
    }

    const previousState = flag.enabled;
    flag.enabled = !flag.enabled;
    flag.updatedBy = new Types.ObjectId(adminId);
    await flag.save();

    // Audit log
    await this.createLog(adminId, AdminAction.FLAG_TOGGLED, 'flag', flag._id.toString(), {
      before: { enabled: previousState },
      after: { enabled: flag.enabled },
    }, ip);

    // Cache temizle
    this.invalidateCache(key);
    this.invalidateAllFlagsCache();

    this.logger.log(`Feature flag toggle: ${key} -> ${flag.enabled} - Admin: ${adminId}`);

    return this.mapToResponse(flag.toObject());
  }

  /**
   * Rollout yüzdesini güncelle
   */
  async updateRollout(
    key: string,
    percentage: number,
    adminId: string,
    ip: string,
  ): Promise<FeatureFlagResponseDto> {
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Rollout yüzdesi 0-100 arasında olmalıdır');
    }

    const flag = await this.featureFlagModel.findOne({ key }).exec();

    if (!flag) {
      throw new NotFoundException(`Feature flag bulunamadı: ${key}`);
    }

    const previousPercentage = flag.rollout.percentage;
    flag.rollout.percentage = percentage;
    flag.updatedBy = new Types.ObjectId(adminId);
    await flag.save();

    // Audit log
    await this.createLog(adminId, AdminAction.FLAG_ROLLOUT_CHANGED, 'flag', flag._id.toString(), {
      before: { rolloutPercentage: previousPercentage },
      after: { rolloutPercentage: percentage },
    }, ip);

    // Cache temizle
    this.invalidateCache(key);
    this.invalidateAllFlagsCache();

    this.logger.log(`Feature flag rollout: ${key} -> ${percentage}% - Admin: ${adminId}`);

    return this.mapToResponse(flag.toObject());
  }

  /**
   * Beta kullanıcıları ekle
   */
  async addBetaUsers(
    key: string,
    userIds: string[],
    adminId: string,
    ip: string,
  ): Promise<FeatureFlagResponseDto> {
    const flag = await this.featureFlagModel.findOne({ key }).exec();

    if (!flag) {
      throw new NotFoundException(`Feature flag bulunamadı: ${key}`);
    }

    const previousUserIds = [...flag.rollout.userIds];
    const newUserIds = userIds.map(id => new Types.ObjectId(id));

    // Mevcut kullanıcıları koru, yenileri ekle
    const uniqueUserIds = [...new Set([
      ...flag.rollout.userIds.map(id => id.toString()),
      ...newUserIds.map(id => id.toString()),
    ])].map(id => new Types.ObjectId(id));

    flag.rollout.userIds = uniqueUserIds;
    flag.updatedBy = new Types.ObjectId(adminId);
    await flag.save();

    // Audit log
    await this.createLog(adminId, AdminAction.FLAG_BETA_USERS_ADDED, 'flag', flag._id.toString(), {
      before: { betaUsers: previousUserIds },
      after: { betaUsers: flag.rollout.userIds },
      addedUsers: userIds,
    }, ip);

    // Cache temizle
    this.invalidateCache(key);
    this.invalidateAllFlagsCache();

    this.logger.log(`Beta kullanıcıları eklendi: ${key} - Admin: ${adminId}`);

    return this.mapToResponse(flag.toObject());
  }

  /**
   * Beta kullanıcıları çıkar
   */
  async removeBetaUsers(
    key: string,
    userIds: string[],
    adminId: string,
    ip: string,
  ): Promise<FeatureFlagResponseDto> {
    const flag = await this.featureFlagModel.findOne({ key }).exec();

    if (!flag) {
      throw new NotFoundException(`Feature flag bulunamadı: ${key}`);
    }

    const previousUserIds = [...flag.rollout.userIds];
    const userIdsToRemove = new Set(userIds);

    flag.rollout.userIds = flag.rollout.userIds.filter(
      id => !userIdsToRemove.has(id.toString()),
    );
    flag.updatedBy = new Types.ObjectId(adminId);
    await flag.save();

    // Audit log
    await this.createLog(adminId, AdminAction.FLAG_BETA_USERS_REMOVED, 'flag', flag._id.toString(), {
      before: { betaUsers: previousUserIds },
      after: { betaUsers: flag.rollout.userIds },
      removedUsers: userIds,
    }, ip);

    // Cache temizle
    this.invalidateCache(key);
    this.invalidateAllFlagsCache();

    this.logger.log(`Beta kullanıcıları çıkarıldı: ${key} - Admin: ${adminId}`);

    return this.mapToResponse(flag.toObject());
  }

  /**
   * Client için config endpoint'i
   */
  async getClientConfig(): Promise<any> {
    const cacheKey = 'all';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const flags = await this.featureFlagModel.find({ enabled: true }).lean().exec();

    const features: Record<string, boolean> = {};
    const premiumFeatures: string[] = [];
    const userSettingKeys: Record<string, string> = {};

    for (const flag of flags) {
      features[flag.key] = true;

      // Premium-only özellikler
      if (flag.permissions.premium && !flag.permissions.free) {
        premiumFeatures.push(flag.key);
      }

      // User setting key mapping
      if (flag.userSetting?.hasUserSetting && flag.userSetting?.settingKey) {
        userSettingKeys[flag.key] = flag.userSetting.settingKey;
      }
    }

    const config = {
      features,
      premiumFeatures,
      userSettingKeys,
    };

    this.setToCache(cacheKey, config);

    return config;
  }

  /**
   * Response mapping
   */
  private mapToResponse(flag: any): FeatureFlagResponseDto {
    return {
      id: flag._id.toString(),
      key: flag.key,
      name: flag.name,
      description: flag.description,
      category: flag.category,
      enabled: flag.enabled,
      rollout: {
        percentage: flag.rollout.percentage,
        userIds: flag.rollout.userIds.map((id: any) => id.toString()),
      },
      permissions: flag.permissions,
      userSetting: flag.userSetting,
      regions: flag.regions,
      platforms: flag.platforms,
      updatedBy: flag.updatedBy?.toString(),
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
    };
  }

  /**
   * Simple in-memory cache helpers
   */
  private getFromCache(key: string): any | null {
    const entry = this.cache.get(`${this.CACHE_PREFIX}${key}`);
    if (entry && entry.expiry > Date.now()) {
      return entry.value;
    }
    this.cache.delete(`${this.CACHE_PREFIX}${key}`);
    return null;
  }

  private setToCache(key: string, value: any): void {
    this.cache.set(`${this.CACHE_PREFIX}${key}`, {
      value,
      expiry: Date.now() + this.CACHE_TTL * 1000,
    });
  }

  private invalidateCache(key: string): void {
    this.cache.delete(`${this.CACHE_PREFIX}${key}`);
  }

  private invalidateAllFlagsCache(): void {
    this.cache.delete(`${this.CACHE_PREFIX}all`);
  }

  /**
   * Audit log oluştur
   */
  private async createLog(
    adminId: string,
    action: AdminAction,
    targetType: string,
    targetId: string,
    details: any,
    ip: string,
  ): Promise<void> {
    await this.adminLogModel.create({
      adminId: new Types.ObjectId(adminId),
      action,
      target: {
        type: targetType,
        id: new Types.ObjectId(targetId),
      },
      details,
      ip,
    });
  }
}
