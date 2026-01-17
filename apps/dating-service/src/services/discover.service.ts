import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { DatingProfile } from '../schemas/dating-profile.schema';
import { Swipe } from '../schemas/swipe.schema';
import {
  DiscoverQueryDto,
  DiscoverResultDto,
  DiscoverProfileDto,
  TopPicksResultDto,
} from '../dto/discover-query.dto';

/**
 * DiscoverService
 * Keşfet (Discover) ekranı için profil getirme algoritmasını yönetir
 */
@Injectable()
export class DiscoverService {
  private readonly logger = new Logger(DiscoverService.name);

  constructor(
    @InjectModel(DatingProfile.name)
    private readonly profileModel: Model<DatingProfile>,
    @InjectModel(Swipe.name)
    private readonly swipeModel: Model<Swipe>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Keşfet ekranı için profilleri getirir
   * Algoritma:
   * 1. Kullanıcının tercihlerine uyan profilleri filtrele
   * 2. Daha önce swipe yapılmış profilleri hariç tut
   * 3. Mesafe bazlı sıralama
   * 4. Boost'lu profilleri öne al
   * 5. Aktiflik durumuna göre sırala
   */
  async getProfiles(
    userId: string,
    query: DiscoverQueryDto,
  ): Promise<DiscoverResultDto> {
    this.logger.debug(`Keşfet profilleri getiriliyor: ${userId}`);

    // Kullanıcının kendi profilini getir
    const userProfile = await this.profileModel
      .findOne({ userId: new Types.ObjectId(userId), isActive: true })
      .lean();

    if (!userProfile) {
      return {
        profiles: [],
        hasMore: false,
        estimatedTotal: 0,
      };
    }

    // Daha önce swipe yapılmış kullanıcıları getir
    const swipedUserIds = await this.getSwipedUserIds(userId);

    // Sorgu limitlerini ayarla
    const limit = Math.min(
      query.limit || 10,
      this.configService.get<number>('dating.discover.maxLimit') || 50,
    );

    // Filtreler
    const minAge = query.minAge || userProfile.preferences?.minAge || 18;
    const maxAge = query.maxAge || userProfile.preferences?.maxAge || 50;
    const maxDistance =
      query.maxDistance ||
      userProfile.preferences?.maxDistance ||
      this.configService.get<number>('dating.discover.maxDistance') ||
      100;
    const genderPreference =
      query.genderPreference || userProfile.preferences?.genderPreference || [];

    // Aggregation pipeline oluştur
    const pipeline: any[] = [
      // Temel filtreler
      {
        $match: {
          userId: { $ne: new Types.ObjectId(userId) }, // Kendini hariç tut
          isActive: true,
          'preferences.showMe': true,
          userId: { $nin: swipedUserIds }, // Daha önce swipe yapılmışları hariç tut
        },
      },

      // Konum bazlı filtreleme (geoNear)
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: userProfile.location.coordinates,
          },
          distanceField: 'distance',
          maxDistance: maxDistance * 1000, // km -> metre
          spherical: true,
        },
      },

      // Cinsiyet filtresi (eğer belirtilmişse)
      ...(genderPreference.length > 0
        ? [
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
              },
            },
            { $unwind: '$user' },
            {
              $match: {
                'user.gender': { $in: genderPreference },
              },
            },
          ]
        : []),

      // Yaş filtresi (doğum tarihinden hesaplama gerekecek)
      // TODO: User service'den yaş bilgisi alınacak

      // Sıralama: Boost'lu önce, sonra mesafe
      {
        $sort: {
          'boost.isActive': -1,
          distance: 1,
          updatedAt: -1,
        },
      },

      // Sadece fotoğraflı profiller (varsayılan true)
      ...(query.withPhotosOnly !== false
        ? [
            {
              $match: {
                'photos.0': { $exists: true },
              },
            },
          ]
        : []),

      // Sadece doğrulanmış profiller (opsiyonel)
      ...(query.verifiedOnly
        ? [
            {
              $match: {
                photoVerified: true,
              },
            },
          ]
        : []),

      // Limit
      { $limit: limit + 1 }, // +1 for hasMore check
    ];

    // Sorguyu çalıştır
    const profiles = await this.profileModel.aggregate(pipeline);

    // hasMore kontrolü
    const hasMore = profiles.length > limit;
    if (hasMore) {
      profiles.pop(); // Fazla kaydı çıkar
    }

    // Ortak ilgi alanlarını hesapla
    const profilesWithCommon = profiles.map((profile) => ({
      ...profile,
      commonInterests: this.findCommonInterests(
        userProfile.interests || [],
        profile.interests || [],
      ),
    }));

    // Response formatına dönüştür
    const result: DiscoverProfileDto[] = profilesWithCommon.map((profile) =>
      this.toDiscoverProfileDto(profile),
    );

    this.logger.debug(
      `Keşfet: ${result.length} profil bulundu (userId: ${userId})`,
    );

    return {
      profiles: result,
      hasMore,
      estimatedTotal: result.length, // Gerçek toplam için ayrı sorgu gerekir
    };
  }

  /**
   * Top Picks - Günün seçilmiş profilleri (Premium özellik)
   */
  async getTopPicks(userId: string): Promise<TopPicksResultDto> {
    this.logger.debug(`Top Picks getiriliyor: ${userId}`);

    // Kullanıcının profilini getir
    const userProfile = await this.profileModel
      .findOne({ userId: new Types.ObjectId(userId), isActive: true })
      .lean();

    if (!userProfile) {
      return {
        picks: [],
        refreshesAt: this.getNextRefreshTime(),
        isPremiumFeature: true,
      };
    }

    // Daha önce swipe yapılmış kullanıcıları getir
    const swipedUserIds = await this.getSwipedUserIds(userId);

    // Top Picks algoritması:
    // 1. Yüksek uyumluluk skoru
    // 2. Aktif kullanıcılar
    // 3. Doğrulanmış profiller öncelikli
    const pipeline: any[] = [
      {
        $match: {
          userId: { $ne: new Types.ObjectId(userId) },
          isActive: true,
          'preferences.showMe': true,
          userId: { $nin: swipedUserIds },
          'photos.0': { $exists: true },
        },
      },
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: userProfile.location.coordinates,
          },
          distanceField: 'distance',
          maxDistance: 100 * 1000, // 100 km
          spherical: true,
        },
      },
      // Uyumluluk skoru hesapla
      {
        $addFields: {
          compatibilityScore: {
            $add: [
              // Doğrulanmış profil bonusu
              { $cond: ['$photoVerified', 20, 0] },
              // İlgi alanı eşleşme bonusu (basit)
              {
                $multiply: [
                  { $size: { $ifNull: ['$interests', []] } },
                  2,
                ],
              },
              // Yakınlık bonusu (ters mesafe)
              {
                $subtract: [
                  100,
                  { $divide: ['$distance', 1000] }, // Yakın = yüksek skor
                ],
              },
            ],
          },
        },
      },
      { $sort: { compatibilityScore: -1 } },
      { $limit: 10 },
    ];

    const profiles = await this.profileModel.aggregate(pipeline);

    return {
      picks: profiles.map((p) => this.toDiscoverProfileDto(p)),
      refreshesAt: this.getNextRefreshTime(),
      isPremiumFeature: true,
    };
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Kullanıcının daha önce swipe yaptığı kullanıcı ID'lerini getirir
   */
  private async getSwipedUserIds(userId: string): Promise<Types.ObjectId[]> {
    const swipes = await this.swipeModel
      .find(
        { swiperId: new Types.ObjectId(userId), isRewound: false },
        { targetId: 1 },
      )
      .lean();

    return swipes.map((s) => s.targetId);
  }

  /**
   * Ortak ilgi alanlarını bulur
   */
  private findCommonInterests(
    userInterests: string[],
    profileInterests: string[],
  ): string[] {
    const userSet = new Set(userInterests.map((i) => i.toLowerCase()));
    return profileInterests.filter((i) => userSet.has(i.toLowerCase()));
  }

  /**
   * Top Picks yenilenme zamanını hesaplar (her gün 00:00)
   */
  private getNextRefreshTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Profili DiscoverProfileDto formatına dönüştürür
   */
  private toDiscoverProfileDto(profile: any): DiscoverProfileDto {
    return {
      userId: profile.userId.toString(),
      displayName: profile.user?.displayName || 'Kullanıcı',
      age: profile.user?.age, // User service'den alınacak
      distance: profile.distance
        ? Math.round(profile.distance / 1000)
        : undefined, // metre -> km
      bio: profile.bio,
      photos: profile.photos.map(
        (p: { url: string; order: number; isMain: boolean }) => ({
          url: p.url,
          order: p.order,
          isMain: p.isMain,
        }),
      ),
      prompts: profile.prompts,
      basics: {
        height: profile.basics?.height,
        work: profile.basics?.work,
        company: profile.basics?.company,
        education: profile.basics?.education,
        livingIn: profile.basics?.livingIn,
      },
      interests: profile.interests,
      isVerified: profile.photoVerified,
      lastActiveAt: profile.updatedAt,
      commonInterests: profile.commonInterests,
    };
  }
}
