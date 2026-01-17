import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Swipe aksiyonları
 */
export enum SwipeAction {
  LIKE = 'like',
  PASS = 'pass',
  SUPERLIKE = 'superlike',
}

/**
 * Swipe - Kaydırma İşlemi Şeması
 * Kullanıcıların diğer profillere yaptığı swipe'ları saklar
 */
@Schema({
  collection: 'swipes',
  timestamps: true,
})
export class Swipe extends Document {
  /**
   * Swipe yapan kullanıcı
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  swiperId: Types.ObjectId;

  /**
   * Hedef kullanıcı (swipe yapılan)
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  targetId: Types.ObjectId;

  /**
   * Swipe aksiyonu: like, pass veya superlike
   */
  @Prop({
    type: String,
    enum: Object.values(SwipeAction),
    required: true,
  })
  action: SwipeAction;

  /**
   * Bu swipe'ın geri alınıp alınmadığı (rewind)
   */
  @Prop({ default: false })
  isRewound: boolean;

  /**
   * Swipe'ın yapıldığı zaman
   * (createdAt ile aynı ama ayrı tutulması bazı sorgularda faydalı)
   */
  @Prop({ type: Date, default: Date.now })
  swipedAt: Date;

  // Timestamps otomatik eklenir: createdAt, updatedAt
}

export const SwipeSchema = SchemaFactory.createForClass(Swipe);

// ========== İNDEKSLER ==========

/**
 * Compound unique index: Bir kullanıcı aynı kişiye sadece bir kez swipe yapabilir
 * (Rewind yapıldığında eski kayıt silinir veya isRewound true yapılır)
 */
SwipeSchema.index(
  { swiperId: 1, targetId: 1 },
  {
    unique: true,
    partialFilterExpression: { isRewound: false },
  },
);

/**
 * "Beni beğenenler" sorgusu için index
 * targetId'ye göre filtreleme, action'a göre filtreleme
 */
SwipeSchema.index({ targetId: 1, action: 1, createdAt: -1 });

/**
 * Kullanıcının swipe geçmişi için index
 */
SwipeSchema.index({ swiperId: 1, createdAt: -1 });

/**
 * Günlük swipe sayısı hesaplama için index
 */
SwipeSchema.index({ swiperId: 1, swipedAt: 1 });

/**
 * Eşleşme kontrolü için index
 * İki kullanıcının karşılıklı like'ı var mı?
 */
SwipeSchema.index({ swiperId: 1, targetId: 1, action: 1 });
