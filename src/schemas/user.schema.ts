import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * User Document Type
 */
export type UserDocument = User & Document;

/**
 * User Stats - Denormalized istatistikler
 */
class UserStats {
  @Prop({ default: 0 })
  postsCount: number;

  @Prop({ default: 0 })
  followersCount: number;

  @Prop({ default: 0 })
  followingCount: number;

  @Prop({ default: 0 })
  likesCount: number;
}

/**
 * Subscription bilgileri
 */
class Subscription {
  @Prop({
    type: String,
    enum: ['free', 'premium', 'business'],
    default: 'free',
  })
  plan: string;

  @Prop()
  expiresAt?: Date;

  @Prop()
  subscribedAt?: Date;
}

/**
 * Doğrulama durumları
 */
class Verification {
  @Prop({ default: false })
  email: boolean;

  @Prop({ default: false })
  phone: boolean;

  @Prop({ default: false })
  identity: boolean;
}

/**
 * OAuth bağlantıları
 */
class OAuthLinks {
  @Prop({ sparse: true })
  google?: string;

  @Prop({ sparse: true })
  apple?: string;
}

/**
 * Aktif modüller
 */
class UserModules {
  @Prop({ default: false })
  dating: boolean;

  @Prop({ default: false })
  listings: boolean;
}

/**
 * FCM Token bilgisi
 */
class FcmToken {
  @Prop({ required: true })
  token: string;

  @Prop()
  deviceId: string;

  @Prop({
    type: String,
    enum: ['ios', 'android', 'web'],
  })
  platform: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

/**
 * User Schema
 *
 * Ana kullanıcı collection'ı.
 * Database Schema'ya uygun (03-database-schema.md)
 */
@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  // ========== IDENTITY ==========

  /**
   * Kullanıcı adı (unique, lowercase)
   */
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-z0-9_]+$/,
  })
  username: string;

  /**
   * Email adresi (unique, lowercase)
   */
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
  })
  email: string;

  /**
   * Telefon numarası (opsiyonel, unique)
   */
  @Prop({
    unique: true,
    sparse: true, // null değerler unique kontrolüne dahil edilmez
  })
  phone?: string;

  /**
   * Şifre hash'i (bcrypt)
   *
   * select: false - varsayılan sorgularda dönmez
   */
  @Prop({
    required: true,
    select: false,
  })
  passwordHash: string;

  // ========== PROFILE ==========

  /**
   * Görünen isim
   */
  @Prop({
    required: true,
    maxlength: 50,
  })
  displayName: string;

  /**
   * Profil fotoğrafı URL'i
   */
  @Prop()
  avatar?: string;

  /**
   * Kapak fotoğrafı URL'i
   */
  @Prop()
  coverImage?: string;

  /**
   * Biyografi
   */
  @Prop({ maxlength: 500 })
  bio?: string;

  /**
   * Web sitesi
   */
  @Prop()
  website?: string;

  /**
   * Doğum tarihi (gizli)
   */
  @Prop({ select: false })
  birthDate?: Date;

  /**
   * Cinsiyet
   */
  @Prop({
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  })
  gender?: string;

  // ========== FLAGS ==========

  /**
   * Gizli hesap mı?
   */
  @Prop({ default: false })
  isPrivate: boolean;

  /**
   * Doğrulanmış mı? (mavi tik)
   */
  @Prop({ default: false })
  isVerified: boolean;

  // ========== STATS ==========

  @Prop({ type: UserStats, default: () => ({}) })
  stats: UserStats;

  // ========== SUBSCRIPTION ==========

  @Prop({ type: Subscription, default: () => ({ plan: 'free' }) })
  subscription: Subscription;

  // ========== STATUS ==========

  /**
   * Hesap durumu
   */
  @Prop({
    type: String,
    enum: ['active', 'suspended', 'banned', 'deleted'],
    default: 'active',
  })
  status: string;

  /**
   * Yasaklama sebebi
   */
  @Prop()
  banReason?: string;

  /**
   * Askıya alma bitiş tarihi
   */
  @Prop()
  suspendedUntil?: Date;

  /**
   * Son görülme zamanı
   */
  @Prop()
  lastSeenAt?: Date;

  // ========== AUTH ==========

  @Prop({ type: OAuthLinks, default: () => ({}) })
  oauth: OAuthLinks;

  // ========== VERIFICATION ==========

  @Prop({ type: Verification, default: () => ({}) })
  verification: Verification;

  // ========== DEVICES ==========

  @Prop({ type: [FcmToken], default: [] })
  fcmTokens: FcmToken[];

  // ========== MODULES ==========

  @Prop({ type: UserModules, default: () => ({}) })
  modules: UserModules;
}

export const UserSchema = SchemaFactory.createForClass(User);

// ========== INDEXES ==========

// Username araması için
UserSchema.index({ username: 1 });

// Email araması için
UserSchema.index({ email: 1 });

// Telefon araması için (sparse: null'lar dahil edilmez)
UserSchema.index({ phone: 1 }, { sparse: true });

// OAuth ID'leri için
UserSchema.index({ 'oauth.google': 1 }, { sparse: true });
UserSchema.index({ 'oauth.apple': 1 }, { sparse: true });

// Admin listeleme için
UserSchema.index({ status: 1, createdAt: -1 });

// Full-text search için
UserSchema.index(
  { displayName: 'text', username: 'text' },
  { weights: { displayName: 2, username: 1 } },
);
