import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Session Document tipi
 */
export type SessionDocument = Session & Document;

/**
 * Session Schema
 *
 * Aktif refresh token'ları ve oturum bilgilerini saklar
 *
 * Her login işleminde yeni bir session oluşturulur
 * Logout işleminde session silinir
 * Token yenileme işleminde refreshToken güncellenir
 *
 * Multi-device desteği:
 * - Her cihaz ayrı bir session
 * - Kullanıcı tüm oturumlarını görebilir
 * - İstediği oturumu sonlandırabilir
 */
@Schema({
  collection: 'sessions',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.refreshToken; // Güvenlik: Token'ı dönme
      return ret;
    },
  },
})
export class Session {
  /**
   * Kullanıcı ID (referans)
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  /**
   * Refresh token (hash'lenmiş)
   * Benzersiz olmalı
   */
  @Prop({ required: true, unique: true })
  refreshToken: string;

  /**
   * Cihaz benzersiz kimliği
   */
  @Prop()
  deviceId?: string;

  /**
   * Cihaz adı (kullanıcıya gösterilir)
   * @example "iPhone 15 Pro", "Chrome - Windows"
   */
  @Prop()
  deviceName?: string;

  /**
   * Platform
   */
  @Prop({ enum: ['ios', 'android', 'web'] })
  platform?: string;

  /**
   * IP adresi
   */
  @Prop()
  ip?: string;

  /**
   * User Agent
   */
  @Prop()
  userAgent?: string;

  /**
   * Son kullanım zamanı
   */
  @Prop()
  lastUsedAt?: Date;

  /**
   * Token son kullanma tarihi
   */
  @Prop({ required: true })
  expiresAt: Date;

  /**
   * Oluşturulma zamanı
   */
  @Prop()
  createdAt: Date;

  /**
   * Güncellenme zamanı
   */
  @Prop()
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// ========== INDEXES ==========

// Refresh token ile hızlı arama
SessionSchema.index({ refreshToken: 1 }, { unique: true });

// Kullanıcının oturumları
SessionSchema.index({ userId: 1 });

// TTL index - Süresi dolan oturumları otomatik sil
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Cihaz bazlı arama
SessionSchema.index({ userId: 1, deviceId: 1 });
