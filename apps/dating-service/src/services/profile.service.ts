import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DatingProfile } from '../schemas/dating-profile.schema';
import {
  CreateDatingProfileDto,
  UpdateDatingProfileDto,
  DatingProfileResponseDto,
} from '../dto/dating-profile.dto';
import { DatingPublisher } from '../events/dating.publisher';

/**
 * ProfileService
 * Flört profili CRUD işlemlerini yönetir
 */
@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectModel(DatingProfile.name)
    private readonly profileModel: Model<DatingProfile>,
    private readonly publisher: DatingPublisher,
  ) {}

  /**
   * Kullanıcının flört profilini getirir
   */
  async getProfile(userId: string): Promise<DatingProfileResponseDto> {
    this.logger.debug(`Profil getiriliyor: ${userId}`);

    const profile = await this.profileModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean();

    if (!profile) {
      throw new NotFoundException('Flört profili bulunamadı');
    }

    return this.toResponseDto(profile);
  }

  /**
   * Yeni flört profili oluşturur
   */
  async createProfile(
    userId: string,
    dto: CreateDatingProfileDto,
  ): Promise<DatingProfileResponseDto> {
    this.logger.debug(`Profil oluşturuluyor: ${userId}`);

    // Mevcut profil kontrolü
    const existingProfile = await this.profileModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean();

    if (existingProfile) {
      throw new ConflictException('Bu kullanıcının zaten bir flört profili var');
    }

    // Fotoğraf validasyonu
    this.validatePhotos(dto.photos);

    // Ana fotoğraf kontrolü
    const photos = this.ensureMainPhoto(dto.photos);

    // Profili oluştur
    const profile = new this.profileModel({
      userId: new Types.ObjectId(userId),
      photos,
      bio: dto.bio,
      prompts: dto.prompts || [],
      basics: dto.basics || {},
      lifestyle: dto.lifestyle || {},
      interests: dto.interests || [],
      preferences: {
        genderPreference: dto.preferences?.genderPreference || ['male', 'female'],
        minAge: dto.preferences?.minAge || 18,
        maxAge: dto.preferences?.maxAge || 50,
        maxDistance: dto.preferences?.maxDistance || 50,
        showMe: dto.preferences?.showMe ?? true,
      },
      settings: dto.settings || {
        hideAge: false,
        hideDistance: false,
        incognitoMode: false,
      },
      location: {
        type: 'Point',
        coordinates: dto.location.coordinates,
      },
      locationUpdatedAt: new Date(),
      stats: {
        likesReceived: 0,
        likesSent: 0,
        matchesCount: 0,
      },
      boost: {
        isActive: false,
      },
      isActive: true,
      photoVerified: false,
    });

    await profile.save();

    this.logger.log(`Profil oluşturuldu: ${userId}`);

    // Event yayınla
    await this.publisher.publishProfileCreated(userId);

    return this.toResponseDto(profile.toObject());
  }

  /**
   * Flört profilini günceller
   */
  async updateProfile(
    userId: string,
    dto: UpdateDatingProfileDto,
  ): Promise<DatingProfileResponseDto> {
    this.logger.debug(`Profil güncelleniyor: ${userId}`);

    const profile = await this.profileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!profile) {
      throw new NotFoundException('Flört profili bulunamadı');
    }

    // Fotoğraf güncellemesi varsa validasyon yap
    if (dto.photos) {
      this.validatePhotos(dto.photos);
      profile.photos = this.ensureMainPhoto(dto.photos);
    }

    // Diğer alanları güncelle
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.prompts !== undefined) profile.prompts = dto.prompts;
    if (dto.basics !== undefined) {
      profile.basics = { ...profile.basics, ...dto.basics };
    }
    if (dto.lifestyle !== undefined) {
      profile.lifestyle = { ...profile.lifestyle, ...dto.lifestyle };
    }
    if (dto.interests !== undefined) profile.interests = dto.interests;
    if (dto.preferences !== undefined) {
      profile.preferences = { ...profile.preferences, ...dto.preferences };
    }
    if (dto.settings !== undefined) {
      profile.settings = { ...profile.settings, ...dto.settings };
    }
    if (dto.location !== undefined) {
      profile.location = {
        type: 'Point',
        coordinates: dto.location.coordinates,
      };
      profile.locationUpdatedAt = new Date();
    }
    if (dto.isActive !== undefined) profile.isActive = dto.isActive;

    await profile.save();

    this.logger.log(`Profil güncellendi: ${userId}`);

    // Event yayınla
    await this.publisher.publishProfileUpdated(userId);

    return this.toResponseDto(profile.toObject());
  }

  /**
   * Flört profilini siler (soft delete - isActive = false)
   */
  async deleteProfile(userId: string): Promise<void> {
    this.logger.debug(`Profil siliniyor: ${userId}`);

    const result = await this.profileModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $set: { isActive: false } },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('Flört profili bulunamadı');
    }

    this.logger.log(`Profil silindi: ${userId}`);

    // Event yayınla
    await this.publisher.publishProfileDeleted(userId);
  }

  /**
   * Profili kalıcı olarak siler (hard delete)
   * Admin işlemleri için
   */
  async hardDeleteProfile(userId: string): Promise<void> {
    this.logger.warn(`Profil kalıcı olarak siliniyor: ${userId}`);

    const result = await this.profileModel.deleteOne({
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Flört profili bulunamadı');
    }

    this.logger.log(`Profil kalıcı olarak silindi: ${userId}`);
  }

  /**
   * Profil aktivasyon durumunu değiştirir
   */
  async toggleActive(userId: string, isActive: boolean): Promise<void> {
    const result = await this.profileModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $set: { isActive } },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('Flört profili bulunamadı');
    }

    this.logger.log(`Profil aktivasyon değişti: ${userId} -> ${isActive}`);
  }

  /**
   * Konum bilgisini günceller
   */
  async updateLocation(
    userId: string,
    coordinates: number[],
  ): Promise<void> {
    const result = await this.profileModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          'location.coordinates': coordinates,
          locationUpdatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('Flört profili bulunamadı');
    }

    this.logger.debug(`Konum güncellendi: ${userId}`);
  }

  /**
   * Fotoğraf doğrulama durumunu günceller
   */
  async updatePhotoVerification(
    userId: string,
    verified: boolean,
  ): Promise<void> {
    await this.profileModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $set: { photoVerified: verified } },
    );

    this.logger.log(`Fotoğraf doğrulama güncellendi: ${userId} -> ${verified}`);
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Fotoğrafları doğrular
   */
  private validatePhotos(
    photos: { url: string; order: number; isMain?: boolean }[],
  ): void {
    if (!photos || photos.length === 0) {
      throw new BadRequestException('En az 1 fotoğraf gerekli');
    }

    if (photos.length > 6) {
      throw new BadRequestException('En fazla 6 fotoğraf eklenebilir');
    }

    // URL formatı kontrolü
    const urlRegex = /^https?:\/\/.+/;
    for (const photo of photos) {
      if (!urlRegex.test(photo.url)) {
        throw new BadRequestException('Geçersiz fotoğraf URL formatı');
      }
    }
  }

  /**
   * En az bir ana fotoğraf olduğundan emin olur
   */
  private ensureMainPhoto(
    photos: { url: string; order: number; isMain?: boolean }[],
  ): { url: string; order: number; isMain: boolean }[] {
    const hasMain = photos.some((p) => p.isMain);

    if (!hasMain) {
      // İlk fotoğrafı ana fotoğraf yap
      return photos.map((p, index) => ({
        ...p,
        isMain: index === 0,
      }));
    }

    return photos.map((p) => ({
      ...p,
      isMain: p.isMain || false,
    }));
  }

  /**
   * Veritabanı kaydını DTO'ya dönüştürür
   */
  private toResponseDto(profile: any): DatingProfileResponseDto {
    return {
      id: profile._id.toString(),
      userId: profile.userId.toString(),
      isActive: profile.isActive,
      photos: profile.photos,
      bio: profile.bio,
      prompts: profile.prompts,
      basics: profile.basics,
      lifestyle: profile.lifestyle,
      interests: profile.interests,
      preferences: profile.preferences,
      settings: profile.settings,
      stats: profile.stats,
      photoVerified: profile.photoVerified,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
