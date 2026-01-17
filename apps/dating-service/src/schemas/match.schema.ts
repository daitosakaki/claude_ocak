import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Eşleşme durumları
 */
export enum MatchStatus {
  ACTIVE = 'active',
  UNMATCHED = 'unmatched',
}

/**
 * Match - Eşleşme Şeması
 * Karşılıklı beğeni sonucu oluşan eşleşmeleri saklar
 */
@Schema({
  collection: 'matches',
  timestamps: true,
})
export class Match extends Document {
  /**
   * Eşleşen kullanıcılar (her zaman sıralı: küçük ID önce)
   * Bu sayede duplicate kontrolü kolaylaşır
   */
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    required: true,
    validate: {
      validator: (users: Types.ObjectId[]) => users.length === 2,
      message: 'Bir eşleşme tam olarak 2 kullanıcı içermelidir',
    },
  })
  users: Types.ObjectId[];

  /**
   * Eşleşme sonrası oluşturulan sohbet ID'si
   */
  @Prop({ type: Types.ObjectId, ref: 'Conversation' })
  conversationId: Types.ObjectId;

  /**
   * Eşleşme durumu
   */
  @Prop({
    type: String,
    enum: Object.values(MatchStatus),
    default: MatchStatus.ACTIVE,
  })
  status: MatchStatus;

  /**
   * Eşleşmeyi kaldıran kullanıcı (unmatch yapan)
   */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  unmatchedBy?: Types.ObjectId;

  /**
   * Unmatch tarihi
   */
  @Prop()
  unmatchedAt?: Date;

  /**
   * Eşleşme tarihi
   */
  @Prop({ type: Date, default: Date.now })
  matchedAt: Date;

  /**
   * Super like ile mi eşleşildi?
   */
  @Prop({ default: false })
  wasSuperLike: boolean;

  /**
   * Super like atan kullanıcı (eğer super like ile eşleşildiyse)
   */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  superLikeBy?: Types.ObjectId;

  // Timestamps otomatik eklenir: createdAt, updatedAt
}

export const MatchSchema = SchemaFactory.createForClass(Match);

// ========== İNDEKSLER ==========

/**
 * İki kullanıcı arasında sadece bir aktif eşleşme olabilir
 */
MatchSchema.index(
  { users: 1 },
  {
    unique: true,
    partialFilterExpression: { status: MatchStatus.ACTIVE },
  },
);

/**
 * Kullanıcının eşleşmelerini getirmek için index
 * (users array'inde arama yapar)
 */
MatchSchema.index({ 'users.0': 1, status: 1, matchedAt: -1 });
MatchSchema.index({ 'users.1': 1, status: 1, matchedAt: -1 });

/**
 * Conversation ID ile eşleşme bulmak için
 */
MatchSchema.index({ conversationId: 1 });

/**
 * Tarih bazlı sorgular için
 */
MatchSchema.index({ matchedAt: -1 });

// ========== VIRTUAL FIELDS ==========

/**
 * users array'ini kullanıcı dostu hale getiren virtual
 */
MatchSchema.virtual('user1').get(function () {
  return this.users[0];
});

MatchSchema.virtual('user2').get(function () {
  return this.users[1];
});

// ========== PRE SAVE HOOK ==========

/**
 * Kayıt öncesi users array'ini sırala
 * Bu sayede duplicate kontrolü kolaylaşır
 */
MatchSchema.pre('save', function (next) {
  if (this.isModified('users')) {
    // ObjectId'leri string'e çevirip sırala, sonra tekrar ObjectId'ye çevir
    const sortedUsers = this.users
      .map((id: Types.ObjectId) => id.toString())
      .sort()
      .map((id: string) => new Types.ObjectId(id));

    this.users = sortedUsers;
  }
  next();
});
