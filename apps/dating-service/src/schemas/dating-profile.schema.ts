import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Fotoğraf alt şeması
 */
export class Photo {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  order: number;

  @Prop({ default: false })
  isMain: boolean;
}

/**
 * Prompt (soru-cevap) alt şeması
 */
export class Prompt {
  @Prop({ required: true, maxlength: 100 })
  question: string;

  @Prop({ required: true, maxlength: 200 })
  answer: string;
}

/**
 * Temel bilgiler alt şeması
 */
export class Basics {
  @Prop({ min: 100, max: 250 })
  height?: number;

  @Prop()
  zodiac?: string;

  @Prop({
    enum: ['high_school', 'bachelors', 'masters', 'phd', 'other'],
  })
  education?: string;

  @Prop({ maxlength: 50 })
  work?: string;

  @Prop({ maxlength: 50 })
  company?: string;

  @Prop({ maxlength: 50 })
  livingIn?: string;

  @Prop([String])
  languages?: string[];

  @Prop({ maxlength: 50 })
  religion?: string;
}

/**
 * Yaşam tarzı alt şeması
 */
export class Lifestyle {
  @Prop({ enum: ['never', 'sometimes', 'regularly'] })
  smoking?: string;

  @Prop({ enum: ['never', 'sometimes', 'regularly'] })
  drinking?: string;

  @Prop({ enum: ['never', 'sometimes', 'regularly'] })
  workout?: string;

  @Prop({ enum: ['none', 'cat', 'dog', 'both', 'other'] })
  pets?: string;

  @Prop({ enum: ['none', 'have', 'want', 'dont_want'] })
  children?: string;
}

/**
 * Tercihler alt şeması
 */
export class Preferences {
  @Prop([{ type: String, enum: ['male', 'female', 'other'] }])
  genderPreference: string[];

  @Prop({ default: 18, min: 18, max: 100 })
  minAge: number;

  @Prop({ default: 50, min: 18, max: 100 })
  maxAge: number;

  @Prop({ default: 50, min: 1, max: 500 })
  maxDistance: number;

  @Prop({ default: true })
  showMe: boolean;
}

/**
 * Ayarlar alt şeması
 */
export class Settings {
  @Prop({ default: false })
  hideAge: boolean;

  @Prop({ default: false })
  hideDistance: boolean;

  @Prop({ default: false })
  incognitoMode: boolean;
}

/**
 * İstatistikler alt şeması
 */
export class Stats {
  @Prop({ default: 0 })
  likesReceived: number;

  @Prop({ default: 0 })
  likesSent: number;

  @Prop({ default: 0 })
  matchesCount: number;
}

/**
 * Boost alt şeması
 */
export class Boost {
  @Prop({ default: false })
  isActive: boolean;

  @Prop()
  expiresAt?: Date;
}

/**
 * DatingProfile - Flört Profili Şeması
 * Kullanıcıların flört modülü profil bilgilerini saklar
 */
@Schema({
  collection: 'dating_profiles',
  timestamps: true,
})
export class DatingProfile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  // ========== FOTOĞRAFLAR ==========
  @Prop({
    type: [
      {
        url: { type: String, required: true },
        order: { type: Number, required: true },
        isMain: { type: Boolean, default: false },
      },
    ],
    required: true,
    validate: {
      validator: (photos: Photo[]) => photos.length >= 1 && photos.length <= 6,
      message: 'En az 1, en fazla 6 fotoğraf gerekli',
    },
  })
  photos: Photo[];

  // ========== BİYOGRAFİ ==========
  @Prop({ required: true, minlength: 10, maxlength: 500 })
  bio: string;

  // ========== PROMPTLAR ==========
  @Prop({
    type: [
      {
        question: { type: String, maxlength: 100 },
        answer: { type: String, maxlength: 200 },
      },
    ],
    validate: {
      validator: (prompts: Prompt[]) => prompts.length <= 3,
      message: 'En fazla 3 prompt eklenebilir',
    },
  })
  prompts: Prompt[];

  // ========== TEMEL BİLGİLER ==========
  @Prop(
    raw({
      height: { type: Number, min: 100, max: 250 },
      zodiac: { type: String },
      education: {
        type: String,
        enum: ['high_school', 'bachelors', 'masters', 'phd', 'other'],
      },
      work: { type: String, maxlength: 50 },
      company: { type: String, maxlength: 50 },
      livingIn: { type: String, maxlength: 50 },
      languages: [{ type: String }],
      religion: { type: String, maxlength: 50 },
    }),
  )
  basics: Basics;

  // ========== YAŞAM TARZI ==========
  @Prop(
    raw({
      smoking: { type: String, enum: ['never', 'sometimes', 'regularly'] },
      drinking: { type: String, enum: ['never', 'sometimes', 'regularly'] },
      workout: { type: String, enum: ['never', 'sometimes', 'regularly'] },
      pets: { type: String, enum: ['none', 'cat', 'dog', 'both', 'other'] },
      children: {
        type: String,
        enum: ['none', 'have', 'want', 'dont_want'],
      },
    }),
  )
  lifestyle: Lifestyle;

  // ========== İLGİ ALANLARI ==========
  @Prop([String])
  interests: string[];

  // ========== TERCİHLER ==========
  @Prop(
    raw({
      genderPreference: [
        { type: String, enum: ['male', 'female', 'other'] },
      ],
      minAge: { type: Number, default: 18, min: 18, max: 100 },
      maxAge: { type: Number, default: 50, min: 18, max: 100 },
      maxDistance: { type: Number, default: 50, min: 1, max: 500 },
      showMe: { type: Boolean, default: true },
    }),
  )
  preferences: Preferences;

  // ========== AYARLAR ==========
  @Prop(
    raw({
      hideAge: { type: Boolean, default: false },
      hideDistance: { type: Boolean, default: false },
      incognitoMode: { type: Boolean, default: false },
    }),
  )
  settings: Settings;

  // ========== KONUM ==========
  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop()
  locationUpdatedAt: Date;

  // ========== İSTATİSTİKLER ==========
  @Prop(
    raw({
      likesReceived: { type: Number, default: 0 },
      likesSent: { type: Number, default: 0 },
      matchesCount: { type: Number, default: 0 },
    }),
  )
  stats: Stats;

  // ========== BOOST ==========
  @Prop(
    raw({
      isActive: { type: Boolean, default: false },
      expiresAt: { type: Date },
    }),
  )
  boost: Boost;

  // ========== DOĞRULAMA ==========
  @Prop({ default: false })
  photoVerified: boolean;

  // Timestamps otomatik eklenir: createdAt, updatedAt
}

export const DatingProfileSchema = SchemaFactory.createForClass(DatingProfile);

// ========== İNDEKSLER ==========

// Kullanıcı ID'si için unique index
DatingProfileSchema.index({ userId: 1 }, { unique: true });

// Keşfet sorgusu için coğrafi index
DatingProfileSchema.index({ location: '2dsphere' });

// Keşfet sorgusu için composite index
DatingProfileSchema.index({
  isActive: 1,
  'boost.isActive': -1,
  updatedAt: -1,
});

// Tercih bazlı filtreleme için index
DatingProfileSchema.index({
  isActive: 1,
  'preferences.genderPreference': 1,
});
