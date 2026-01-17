import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Session Document Type
 *
 * Mongoose Document ile Session'ı birleştirir.
 */
export type SessionDocument = Session & Document;

/**
 * Session Schema
 *
 * Aktif refresh token'ları takip eder.
 * Her cihaz için ayrı session tutulur.
 *
 * Database Schema'ya uygun (03-database-schema.md)
 */
@Schema({
  timestamps: true,
  collection: 'sessions',
})
export class Session {
  /**
   * Session sahibi kullanıcı
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  /**
   * Refresh Token
   *
   * Unique - her session için farklı token
   */
  @Prop({
    required: true,
    unique: true,
  })
  refreshToken: string;

  /**
   * Cihaz ID
   *
   * Client tarafından gönderilen UUID.
   * Aynı cihazdan yeni login = önceki session silinir.
   */
  @Prop()
  deviceId: string;

  /**
   * Cihaz Adı
   *
   * Kullanıcı dostu isim. Örn: "iPhone 15 Pro"
   */
  @Prop()
  deviceName: string;

  /**
   * Platform
   */
  @Prop({
    type: String,
    enum: ['ios', 'android', 'web'],
  })
  platform: string;

  /**
   * IP Adresi
   *
   * Login anındaki IP. Güvenlik logları için.
   */
  @Prop()
  ip: string;

  /**
   * User Agent
   *
   * Browser/app bilgisi
   */
  @Prop()
  userAgent: string;

  /**
   * Son Kullanım Zamanı
   *
   * Token refresh edildiğinde güncellenir.
   */
  @Prop()
  lastUsedAt: Date;

  /**
   * Bitiş Zamanı
   *
   * Bu tarihten sonra session geçersiz.
   * TTL index ile otomatik silinir.
   */
  @Prop({
    required: true,
    index: true,
  })
  expiresAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

/**
 * TTL Index
 *
 * Süresi dolan session'ları MongoDB otomatik siler.
 * expireAfterSeconds: 0 = expiresAt alanındaki tarihte sil
 */
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Compound Index
 *
 * userId + deviceId kombinasyonu için.
 * Aynı kullanıcının aynı cihazdan session'ı hızlı bul.
 */
SessionSchema.index({ userId: 1, deviceId: 1 });
