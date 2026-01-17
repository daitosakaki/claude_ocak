import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from '../schemas/session.schema';
import { TTL } from '../config/database.config';

/**
 * Session oluşturma parametreleri
 */
interface CreateSessionParams {
  userId: string;
  refreshToken: string;
  deviceId?: string;
  deviceName?: string;
  platform?: 'ios' | 'android' | 'web';
  ip?: string;
  userAgent?: string;
}

/**
 * Session Service
 *
 * Oturum yönetimi işlemleri
 *
 * Özellikler:
 * - Multi-device desteği
 * - Oturum listeleme
 * - Tekil/toplu oturum sonlandırma
 * - Token rotation
 *
 * Her cihaz için ayrı session kaydı tutulur.
 * Kullanıcı istediği oturumu uzaktan sonlandırabilir.
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  /**
   * Yeni oturum oluştur
   */
  async createSession(params: CreateSessionParams): Promise<SessionDocument> {
    const {
      userId,
      refreshToken,
      deviceId,
      deviceName,
      platform,
      ip,
      userAgent,
    } = params;

    // Aynı cihazda mevcut oturum varsa güncelle
    if (deviceId) {
      const existingSession = await this.sessionModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId), deviceId },
        {
          refreshToken,
          deviceName,
          platform,
          ip,
          userAgent,
          lastUsedAt: new Date(),
          expiresAt: new Date(Date.now() + TTL.SESSION * 1000),
        },
        { new: true },
      );

      if (existingSession) {
        this.logger.log(`Session updated for device: ${deviceId}`);
        return existingSession;
      }
    }

    // Yeni oturum oluştur
    const session = new this.sessionModel({
      userId: new Types.ObjectId(userId),
      refreshToken,
      deviceId,
      deviceName,
      platform,
      ip,
      userAgent,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + TTL.SESSION * 1000),
    });

    await session.save();
    this.logger.log(`New session created for user: ${userId}`);

    return session;
  }

  /**
   * Refresh token ile session bul
   */
  async findByRefreshToken(refreshToken: string): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({ refreshToken });
  }

  /**
   * Kullanıcının tüm oturumlarını listele
   */
  async findUserSessions(userId: string): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ lastUsedAt: -1 })
      .lean();
  }

  /**
   * Session token'ını güncelle (rotation)
   */
  async updateSessionToken(
    sessionId: string,
    newRefreshToken: string,
  ): Promise<void> {
    await this.sessionModel.updateOne(
      { _id: new Types.ObjectId(sessionId) },
      {
        refreshToken: newRefreshToken,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + TTL.SESSION * 1000),
      },
    );
    this.logger.log(`Session token rotated: ${sessionId}`);
  }

  /**
   * Tekil oturumu sonlandır (refresh token ile)
   */
  async revokeSession(refreshToken: string): Promise<void> {
    const result = await this.sessionModel.deleteOne({ refreshToken });
    if (result.deletedCount > 0) {
      this.logger.log('Session revoked');
    }
  }

  /**
   * Tekil oturumu sonlandır (session ID ile)
   */
  async revokeSessionById(sessionId: string): Promise<void> {
    await this.sessionModel.deleteOne({ _id: new Types.ObjectId(sessionId) });
    this.logger.log(`Session revoked: ${sessionId}`);
  }

  /**
   * Kullanıcının tüm oturumlarını sonlandır
   */
  async revokeAllSessions(userId: string): Promise<number> {
    const result = await this.sessionModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
    this.logger.log(`All sessions revoked for user: ${userId}, count: ${result.deletedCount}`);
    return result.deletedCount;
  }

  /**
   * Belirli bir cihaz hariç tüm oturumları sonlandır
   */
  async revokeOtherSessions(
    userId: string,
    currentDeviceId: string,
  ): Promise<number> {
    const result = await this.sessionModel.deleteMany({
      userId: new Types.ObjectId(userId),
      deviceId: { $ne: currentDeviceId },
    });
    this.logger.log(
      `Other sessions revoked for user: ${userId}, count: ${result.deletedCount}`,
    );
    return result.deletedCount;
  }

  /**
   * Süresi dolmuş oturumları temizle (cron job için)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    if (result.deletedCount > 0) {
      this.logger.log(`Expired sessions cleaned up: ${result.deletedCount}`);
    }
    return result.deletedCount;
  }
}
