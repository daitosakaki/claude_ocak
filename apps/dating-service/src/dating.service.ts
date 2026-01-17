import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatingProfile } from './schemas/dating-profile.schema';
import { Swipe } from './schemas/swipe.schema';
import { Match } from './schemas/match.schema';

/**
 * Dating Service
 * Flört modülü için ana servis sınıfı
 * Diğer servisleri koordine eder ve ortak işlemleri yönetir
 */
@Injectable()
export class DatingService {
  private readonly logger = new Logger(DatingService.name);

  constructor(
    @InjectModel(DatingProfile.name)
    private readonly profileModel: Model<DatingProfile>,
    @InjectModel(Swipe.name)
    private readonly swipeModel: Model<Swipe>,
    @InjectModel(Match.name)
    private readonly matchModel: Model<Match>,
  ) {}

  /**
   * Kullanıcının flört modülüne aktif olup olmadığını kontrol eder
   */
  async isUserActive(userId: string): Promise<boolean> {
    const profile = await this.profileModel
      .findOne({ userId, isActive: true })
      .lean();
    return !!profile;
  }

  /**
   * Kullanıcının profil istatistiklerini getirir
   */
  async getUserStats(userId: string) {
    const [likesReceived, likesSent, matchesCount] = await Promise.all([
      this.swipeModel.countDocuments({
        targetId: userId,
        action: { $in: ['like', 'superlike'] },
      }),
      this.swipeModel.countDocuments({
        swiperId: userId,
        action: { $in: ['like', 'superlike'] },
      }),
      this.matchModel.countDocuments({
        users: userId,
        status: 'active',
      }),
    ]);

    return {
      likesReceived,
      likesSent,
      matchesCount,
    };
  }

  /**
   * İki kullanıcının eşleşip eşleşmediğini kontrol eder
   */
  async areUsersMatched(userId1: string, userId2: string): Promise<boolean> {
    const sortedUsers = [userId1, userId2].sort();

    const match = await this.matchModel
      .findOne({
        users: sortedUsers,
        status: 'active',
      })
      .lean();

    return !!match;
  }

  /**
   * Kullanıcının günlük swipe limitini kontrol eder
   */
  async getDailySwipeCount(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.swipeModel.countDocuments({
      swiperId: userId,
      createdAt: { $gte: startOfDay },
    });
  }

  /**
   * Kullanıcının premium özelliklerini kontrol eder
   * TODO: User service'den premium durumunu kontrol et
   */
  async checkPremiumStatus(userId: string): Promise<{
    isPremium: boolean;
    features: string[];
  }> {
    // Bu kısım user-service ile entegre edilecek
    this.logger.debug(`Premium durum kontrolü: ${userId}`);

    return {
      isPremium: false,
      features: [],
    };
  }

  /**
   * Kullanıcının flört ayarlarını doğrular
   */
  async validateUserSettings(userId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const profile = await this.profileModel.findOne({ userId }).lean();

    const errors: string[] = [];

    if (!profile) {
      errors.push('Flört profili bulunamadı');
      return { isValid: false, errors };
    }

    if (!profile.photos || profile.photos.length === 0) {
      errors.push('En az bir fotoğraf gerekli');
    }

    if (!profile.bio || profile.bio.length < 10) {
      errors.push('Biyografi en az 10 karakter olmalı');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
