import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { DatingProfile } from '../schemas/dating-profile.schema';
import { DatingPublisher } from '../events/dating.publisher';

/**
 * Boost durumu yanıt tipi
 */
interface BoostStatusResponse {
  isActive: boolean;
  expiresAt?: Date;
  remainingMinutes?: number;
  canActivate: boolean;
  cooldownEndsAt?: Date;
  nextFreeBoost?: Date;
}

/**
 * Boost aktivasyon yanıt tipi
 */
interface BoostActivationResponse {
  success: boolean;
  expiresAt: Date;
  durationMinutes: number;
}

/**
 * BoostService
 * Profil öne çıkarma (Boost) özelliğini yönetir
 * Boost aktif olduğunda kullanıcının profili keşfet'te önce gösterilir
 */
@Injectable()
export class BoostService {
  private readonly logger = new Logger(BoostService.name);

  constructor(
    @InjectModel(DatingProfile.name)
    private readonly profileModel: Model<DatingProfile>,
    private readonly configService: ConfigService,
    private readonly publisher: DatingPublisher,
  ) {}

  /**
   * Boost durumunu kontrol eder
   */
  async getBoostStatus(userId: string): Promise<BoostStatusResponse> {
    this.logger.debug(`Boost durumu kontrol ediliyor: ${userId}`);

    const profile = await this.profileModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean();

    if (!profile) {
      throw new NotFoundException('Flört profili bulunamadı');
    }

    const now = new Date();
    const isActive =
      profile.boost?.isActive &&
      profile.boost?.expiresAt &&
      profile.boost.expiresAt > now;

    // Cooldown kontrolü
    const cooldownHours =
      this.configService.get<number>('dating.boost.cooldownHours') || 24;
    const lastBoostEnd = profile.boost?.expiresAt;
    let canActivate = true;
    let cooldownEndsAt: Date | undefined;

    if (lastBoostEnd) {
      const cooldownEnd = new Date(
        lastBoostEnd.getTime() + cooldownHours * 60 * 60 * 1000,
      );
      if (cooldownEnd > now) {
        canActivate = false;
        cooldownEndsAt = cooldownEnd;
      }
    }

    // Premium kullanıcılar için aylık ücretsiz boost
    // TODO: User service'den premium durumu kontrol edilecek
    const isPremium = false;
    const nextFreeBoost = isPremium
      ? this.getNextMonthlyBoostDate()
      : undefined;

    return {
      isActive,
      expiresAt: isActive ? profile.boost?.expiresAt : undefined,
      remainingMinutes: isActive
        ? Math.ceil(
            (profile.boost!.expiresAt!.getTime() - now.getTime()) / 60000,
          )
        : undefined,
      canActivate: canActivate && !isActive,
      cooldownEndsAt,
      nextFreeBoost,
    };
  }

  /**
   * Boost'u aktifleştirir
   */
  async activateBoost(userId: string): Promise<BoostActivationResponse> {
    this.logger.debug(`Boost aktifleştiriliyor: ${userId}`);

    const profile = await this.profileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!profile) {
      throw new NotFoundException('Flört profili bulunamadı');
    }

    // Profil aktif mi?
    if (!profile.isActive) {
      throw new BadRequestException(
        'Boost kullanmak için profilinizi aktifleştirin',
      );
    }

    // Zaten aktif mi?
    const now = new Date();
    if (
      profile.boost?.isActive &&
      profile.boost?.expiresAt &&
      profile.boost.expiresAt > now
    ) {
      throw new BadRequestException('Boost zaten aktif');
    }

    // Cooldown kontrolü
    const cooldownHours =
      this.configService.get<number>('dating.boost.cooldownHours') || 24;
    if (profile.boost?.expiresAt) {
      const cooldownEnd = new Date(
        profile.boost.expiresAt.getTime() + cooldownHours * 60 * 60 * 1000,
      );
      if (cooldownEnd > now) {
        throw new ForbiddenException(
          `Boost tekrar kullanabilmek için ${this.formatTimeRemaining(cooldownEnd)} bekleyin`,
        );
      }
    }

    // TODO: Ödeme kontrolü veya premium hak kontrolü
    // Bu kısım payment service ile entegre edilecek

    // Boost süresini ayarla
    const durationMinutes =
      this.configService.get<number>('dating.boost.durationMinutes') || 30;
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    // Boost'u aktifleştir
    profile.boost = {
      isActive: true,
      expiresAt,
    };

    await profile.save();

    // Event yayınla
    await this.publisher.publishBoostActivated(userId, expiresAt);

    this.logger.log(`Boost aktifleştirildi: ${userId} (${durationMinutes} dk)`);

    return {
      success: true,
      expiresAt,
      durationMinutes,
    };
  }

  /**
   * Boost'u deaktif eder (Admin veya süre dolunca)
   */
  async deactivateBoost(userId: string): Promise<void> {
    await this.profileModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $set: { 'boost.isActive': false } },
    );

    this.logger.log(`Boost deaktif edildi: ${userId}`);
  }

  /**
   * Süresi dolmuş boost'ları temizler (Scheduled job)
   */
  async cleanupExpiredBoosts(): Promise<number> {
    const now = new Date();

    const result = await this.profileModel.updateMany(
      {
        'boost.isActive': true,
        'boost.expiresAt': { $lt: now },
      },
      { $set: { 'boost.isActive': false } },
    );

    if (result.modifiedCount > 0) {
      this.logger.log(`${result.modifiedCount} süresi dolmuş boost temizlendi`);
    }

    return result.modifiedCount;
  }

  /**
   * Aktif boost'lu profilleri getirir (Admin)
   */
  async getActiveBoostedProfiles(limit: number = 100): Promise<any[]> {
    const now = new Date();

    return this.profileModel
      .find({
        'boost.isActive': true,
        'boost.expiresAt': { $gt: now },
      })
      .sort({ 'boost.expiresAt': 1 })
      .limit(limit)
      .lean();
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Sonraki aylık ücretsiz boost tarihini hesaplar
   */
  private getNextMonthlyBoostDate(): Date {
    const now = new Date();
    // Ayın 1'i saat 00:00
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
  }

  /**
   * Kalan süreyi formatlar
   */
  private formatTimeRemaining(targetDate: Date): string {
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours} saat ${diffMinutes} dakika`;
    }
    return `${diffMinutes} dakika`;
  }
}
