import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * User Document tipi
 */
export type UserDocument = User & Document;

/**
 * OAuth bağlantıları
 */
@Schema({ _id: false })
class OAuth {
  @Prop()
  google?: string;

  @Prop()
  apple?: string;
}

/**
 * Doğrulama durumları
 */
@Schema({ _id: false })
class Verification {
  @Prop({ default: false })
  email: boolean;

  @Prop({ default: false })
  phone: boolean;

  @Prop({ default: false })
  identity: boolean;
}

/**
 * Kullanıcı istatistikleri (denormalized)
 */
@Schema({ _id: false })
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
 * Abonelik bilgileri
 */
@Schema({ _id: false })
class Subscription {
  @Prop({ enum: ['free', 'premium', 'business'], default: 'free' })
  plan: string;

  @Prop()
  expiresAt?: Date;

  @Prop()
  subscribedAt?: Date;
}

/**
 * FCM Push Token
 */
@Schema({ _id: false })
class FcmToken {
  @Prop({ required: true })
  token: string;

  @Prop()
  deviceId: string;

  @Prop({ enum: ['ios', 'android', 'web'] })
  platform: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

/**
 * Modül erişimleri
 */
@Schema({ _id: false })
class Modules {
  @Prop({ default: false })
  dating: boolean;

  @Prop({ default: false })
  listings: boolean;
}

/**
 * User Schema
 *
 * Ana kullanıcı koleksiyonu
 * Sık erişilen veriler burada tutulur
 *
 * İlişkili koleksiyonlar:
 * - user_settings: Detaylı ayarlar
 * - user_keys: E2EE public key'ler
 * - sessions: Aktif oturumlar
 */
@Schema({
  collection: 'users',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      return ret;
    },
  },
})
export class User {
  // ========== IDENTITY ==========

  /**
   * Benzersiz kullanıcı adı
   * Küçük harf, 3-20 karakter, sadece a-z, 0-9, _
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
   * Email adresi
   * Benzersiz, küçük harfe dönüştürülür
   */
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
  })
  email: string;

  /**
   * Telefon numarası (opsiyonel)
   */
  @Prop({ sparse: true, unique: true })
  phone?: string;

  /**
   * Hash'lenmiş şifre
   * bcrypt ile hash'lenir, API yanıtlarında dönmez
   */
  @Prop({ required: true, select: false })
  passwordHash: string;

  // ========== PROFILE ==========

  /**
   * Görünen isim
   */
  @Prop({ required: true, maxlength: 50 })
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
  @Prop({ enum: ['male', 'female', 'other', 'prefer_not_to_say'] })
  gender?: string;

  // ========== FLAGS ==========

  /**
   * Gizli hesap mı
   */
  @Prop({ default: false })
  isPrivate: boolean;

  /**
   * Doğrulanmış mı (mavi tik)
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
    enum: ['active', 'suspended', 'banned', 'deleted'],
    default: 'active',
  })
  status: string;

  /**
   * Ban nedeni
   */
  @Prop()
  banReason?: string;

  /**
   * Askıya alınma bitiş tarihi
   */
  @Prop()
  suspendedUntil?: Date;

  /**
   * Son görülme zamanı
   */
  @Prop()
  lastSeenAt?: Date;

  // ========== AUTH ==========

  @Prop({ type: OAuth })
  oauth?: OAuth;

  // ========== VERIFICATION ==========

  @Prop({ type: Verification, default: () => ({}) })
  verification: Verification;

  // ========== DEVICES ==========

  @Prop({ type: [FcmToken], default: [] })
  fcmTokens: FcmToken[];

  // ========== MODULES ==========

  @Prop({ type: Modules, default: () => ({}) })
  modules: Modules;

  // ========== TIMESTAMPS ==========

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// ========== INDEXES ==========

// Benzersiz alanlar
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });

// OAuth alanları (sparse - null değerler indekslenmez)
UserSchema.index({ 'oauth.google': 1 }, { sparse: true });
UserSchema.index({ 'oauth.apple': 1 }, { sparse: true });

// Admin listeleme
UserSchema.index({ status: 1, createdAt: -1 });

// Full-text search
UserSchema.index(
  { displayName: 'text', username: 'text' },
  { weights: { displayName: 2, username: 1 } },
);
