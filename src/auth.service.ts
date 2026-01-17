import {
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { User, UserDocument } from './schemas/user.schema';
import { Session, SessionDocument } from './schemas/session.schema';
import { LoginDto, AuthResponseDto, UserResponse } from './dto';

/**
 * Login için ek parametreler
 *
 * Controller'dan gelen IP ve User-Agent bilgileri
 */
interface LoginParams extends LoginDto {
  ip: string;
  userAgent: string;
}

/**
 * JWT Payload yapısı
 */
interface JwtPayload {
  sub: string; // userId
  email: string;
  type: 'access' | 'refresh';
}

/**
 * Auth Service
 *
 * Kimlik doğrulama işlemlerini yönetir:
 * - Login
 * - Token oluşturma
 * - Session yönetimi
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Token süreleri (saniye)
  private readonly ACCESS_TOKEN_TTL = 15 * 60; // 15 dakika
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 gün

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Kullanıcı Girişi
   *
   * İşlem adımları:
   * 1. Email ile kullanıcı bul
   * 2. Şifreyi doğrula (bcrypt)
   * 3. Hesap durumunu kontrol et (banned, suspended)
   * 4. Access ve Refresh token oluştur
   * 5. Session kaydet (refresh token için)
   * 6. lastSeenAt güncelle
   *
   * @param params - Login bilgileri + IP/UserAgent
   * @returns Kullanıcı bilgileri ve token'lar
   * @throws UnauthorizedException - Geçersiz credentials veya yasaklı hesap
   */
  async login(params: LoginParams): Promise<AuthResponseDto> {
    const { email, password, deviceId, deviceName, platform, ip, userAgent } =
      params;

    // 1. Kullanıcıyı bul (passwordHash dahil)
    const user = await this.findUserByEmail(email);

    if (!user) {
      this.logger.warn(
        `Başarısız giriş denemesi: ${email} - Kullanıcı bulunamadı`,
      );
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email veya şifre hatalı',
      });
    }

    // 2. Şifreyi doğrula
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`Başarısız giriş denemesi: ${email} - Yanlış şifre`);
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email veya şifre hatalı',
      });
    }

    // 3. Hesap durumunu kontrol et
    this.validateUserStatus(user);

    // 4. Token'ları oluştur
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // 5. Session kaydet
    await this.createSession({
      userId: user._id.toString(),
      refreshToken,
      deviceId: deviceId || uuidv4(),
      deviceName,
      platform,
      ip,
      userAgent,
    });

    // 6. lastSeenAt güncelle
    await this.updateLastSeen(user._id.toString());

    this.logger.log(`Başarılı giriş: ${email} (${platform || 'unknown'})`);

    // Response oluştur
    return {
      user: this.mapUserToResponse(user),
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_TTL,
    };
  }

  /**
   * Email ile kullanıcı bul
   *
   * passwordHash alanı dahil edilir (select: false override)
   */
  private async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .lean()
      .exec();
  }

  /**
   * Şifre doğrulama
   *
   * bcrypt ile hash karşılaştırması
   */
  private async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      this.logger.error('Şifre doğrulama hatası', error);
      return false;
    }
  }

  /**
   * Kullanıcı durumunu kontrol et
   *
   * Banned veya suspended kullanıcılar giriş yapamaz.
   *
   * @throws UnauthorizedException - Yasaklı veya askıya alınmış hesap
   */
  private validateUserStatus(user: UserDocument): void {
    // Kalıcı yasaklı
    if (user.status === 'banned') {
      this.logger.warn(`Yasaklı kullanıcı giriş denemesi: ${user.email}`);
      throw new UnauthorizedException({
        code: 'ACCOUNT_BANNED',
        message: 'Hesabınız kalıcı olarak yasaklanmıştır',
        details: { reason: user.banReason },
      });
    }

    // Geçici askıya alınmış
    if (user.status === 'suspended') {
      const now = new Date();

      // Askıya alma süresi dolmuş mu kontrol et
      if (user.suspendedUntil && user.suspendedUntil > now) {
        this.logger.warn(
          `Askıya alınmış kullanıcı giriş denemesi: ${user.email}`,
        );
        throw new UnauthorizedException({
          code: 'ACCOUNT_SUSPENDED',
          message: 'Hesabınız geçici olarak askıya alınmıştır',
          details: { suspendedUntil: user.suspendedUntil.toISOString() },
        });
      }
      // Süre dolmuşsa login'e izin ver (status güncelleme ayrı job ile yapılabilir)
    }

    // Silinmiş hesap
    if (user.status === 'deleted') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DELETED',
        message: 'Bu hesap silinmiştir',
      });
    }
  }

  /**
   * Access ve Refresh Token Oluştur
   *
   * Access Token: Kısa ömürlü (15 dk), RS256 algoritması
   * Refresh Token: Uzun ömürlü (7 gün), ayrı secret
   */
  private async generateTokens(user: UserDocument): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: Omit<JwtPayload, 'type'> = {
      sub: user._id.toString(),
      email: user.email,
    };

    try {
      // Access Token (RS256 - asymmetric key)
      const accessToken = this.jwtService.sign(
        { ...payload, type: 'access' },
        {
          expiresIn: this.ACCESS_TOKEN_TTL,
          algorithm: 'RS256',
          privateKey: this.configService.get<string>('JWT_PRIVATE_KEY'),
        },
      );

      // Refresh Token (HS256 - symmetric, farklı secret)
      const refreshToken = this.jwtService.sign(
        { ...payload, type: 'refresh' },
        {
          expiresIn: this.REFRESH_TOKEN_TTL,
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error('Token oluşturma hatası', error);
      throw new InternalServerErrorException({
        code: 'TOKEN_GENERATION_ERROR',
        message: 'Token oluşturulamadı',
      });
    }
  }

  /**
   * Session Oluştur
   *
   * Refresh token'ın geçerliliğini takip etmek için veritabanına kaydet.
   * Aynı cihazdan önceki session silinir (tek cihaz = tek session).
   */
  private async createSession(params: {
    userId: string;
    refreshToken: string;
    deviceId: string;
    deviceName?: string;
    platform?: string;
    ip: string;
    userAgent: string;
  }): Promise<SessionDocument> {
    const {
      userId,
      refreshToken,
      deviceId,
      deviceName,
      platform,
      ip,
      userAgent,
    } = params;

    // Aynı cihazdan önceki session'ı sil
    await this.sessionModel.deleteMany({ userId, deviceId });

    // Bitiş zamanını hesapla
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.REFRESH_TOKEN_TTL);

    // Yeni session oluştur
    const session = new this.sessionModel({
      userId,
      refreshToken,
      deviceId,
      deviceName,
      platform,
      ip,
      userAgent,
      expiresAt,
      lastUsedAt: new Date(),
    });

    return session.save();
  }

  /**
   * Son görülme zamanını güncelle
   */
  private async updateLastSeen(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { lastSeenAt: new Date() } },
    );
  }

  /**
   * User document'ı response formatına dönüştür
   *
   * passwordHash gibi hassas alanları çıkarır.
   */
  private mapUserToResponse(user: UserDocument): UserResponse {
    return {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      coverImage: user.coverImage,
      bio: user.bio,
      isPrivate: user.isPrivate,
      isVerified: user.isVerified,
      stats: {
        postsCount: user.stats?.postsCount || 0,
        followersCount: user.stats?.followersCount || 0,
        followingCount: user.stats?.followingCount || 0,
        likesCount: user.stats?.likesCount || 0,
      },
      subscription: {
        plan: (user.subscription?.plan as 'free' | 'premium' | 'business') || 'free',
        expiresAt: user.subscription?.expiresAt?.toISOString(),
        subscribedAt: user.subscription?.subscribedAt?.toISOString(),
      },
      verification: {
        email: user.verification?.email || false,
        phone: user.verification?.phone || false,
        identity: user.verification?.identity || false,
      },
      modules: {
        dating: user.modules?.dating || false,
        listings: user.modules?.listings || false,
      },
      createdAt: user['createdAt']?.toISOString() || new Date().toISOString(),
    };
  }
}
