import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserSettings, UserSettingsDocument } from '../schemas/user-settings.schema';
import { UpdateSettingsDto } from '../dto/update-settings.dto';
import { RedisService } from '@superapp/shared-database';
import { LoggerService } from '@superapp/shared-logger';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(UserSettings.name) private settingsModel: Model<UserSettingsDocument>,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Kullanıcı ayarlarını getir
   */
  async get(userId: string): Promise<UserSettingsDocument> {
    // Cache kontrol
    const cacheKey = `user:${userId}:settings`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    let settings = await this.settingsModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    // Ayarlar yoksa varsayılan oluştur
    if (!settings) {
      settings = await this.create(userId);
    }

    // Cache'e kaydet (5 dakika)
    await this.redisService.setex(cacheKey, 300, JSON.stringify(settings));

    return settings;
  }

  /**
   * Varsayılan ayarlar oluştur
   */
  async create(userId: string): Promise<UserSettingsDocument> {
    const settings = new this.settingsModel({
      userId: new Types.ObjectId(userId),
      privacy: {
        whoCanDM: 'everyone',
        whoCanTag: 'everyone',
        whoCanSeeFollowers: 'everyone',
        hideFromSearch: false,
        hideFromContacts: false,
        twoFactorEnabled: false,
      },
      content: {
        sensitiveContentFilter: true,
        mutedWords: [],
        contentLanguages: ['tr'],
        autoPlayVideos: 'wifi',
      },
      display: {
        theme: 'system',
        language: 'tr',
        dataSaver: false,
        reduceMotion: false,
        hapticFeedback: true,
      },
      location: {
        type: 'Point',
      },
    });

    await settings.save();

    this.logger.log(`Varsayılan ayarlar oluşturuldu: ${userId}`, 'SettingsService');

    return settings;
  }

  /**
   * Kullanıcı ayarlarını güncelle
   */
  async update(userId: string, dto: UpdateSettingsDto): Promise<UserSettingsDocument> {
    const updateData: Record<string, unknown> = {};

    // Privacy ayarları
    if (dto.privacy) {
      Object.entries(dto.privacy).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[`privacy.${key}`] = value;
        }
      });
    }

    // Content ayarları
    if (dto.content) {
      Object.entries(dto.content).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[`content.${key}`] = value;
        }
      });
    }

    // Display ayarları
    if (dto.display) {
      Object.entries(dto.display).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[`display.${key}`] = value;
        }
      });
    }

    updateData.updatedAt = new Date();

    // Ayarlar yoksa oluştur
    const settings = await this.settingsModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: updateData },
        { new: true, upsert: true },
      )
      .exec();

    // Cache invalidate
    await this.redisService.del(`user:${userId}:settings`);

    this.logger.log(`Ayarlar güncellendi: ${userId}`, 'SettingsService');

    return settings!;
  }

  /**
   * Konum güncelle
   */
  async updateLocation(
    userId: string,
    coordinates: [number, number], // [longitude, latitude]
    city?: string,
    country?: string,
  ): Promise<void> {
    await this.settingsModel
      .updateOne(
        { userId: new Types.ObjectId(userId) },
        {
          $set: {
            'location.coordinates': coordinates,
            'location.city': city,
            'location.country': country,
            'location.updatedAt': new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      )
      .exec();

    // Cache invalidate
    await this.redisService.del(`user:${userId}:settings`);
  }

  /**
   * 2FA secret güncelle
   */
  async update2FASecret(userId: string, secret: string | null): Promise<void> {
    await this.settingsModel
      .updateOne(
        { userId: new Types.ObjectId(userId) },
        {
          $set: {
            'privacy.twoFactorSecret': secret,
            'privacy.twoFactorEnabled': !!secret,
            updatedAt: new Date(),
          },
        },
      )
      .exec();

    // Cache invalidate
    await this.redisService.del(`user:${userId}:settings`);
  }

  /**
   * Muted words güncelle
   */
  async updateMutedWords(userId: string, words: string[]): Promise<void> {
    // Temizle ve küçük harfe çevir
    const cleanedWords = [...new Set(words.map((w) => w.toLowerCase().trim()))];

    await this.settingsModel
      .updateOne(
        { userId: new Types.ObjectId(userId) },
        {
          $set: {
            'content.mutedWords': cleanedWords,
            updatedAt: new Date(),
          },
        },
      )
      .exec();

    // Cache invalidate
    await this.redisService.del(`user:${userId}:settings`);
  }

  /**
   * Belirli bir ayarı getir
   */
  async getSetting<T>(userId: string, path: string): Promise<T | undefined> {
    const settings = await this.get(userId);
    const parts = path.split('.');

    let value: unknown = settings;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value as T;
  }
}
