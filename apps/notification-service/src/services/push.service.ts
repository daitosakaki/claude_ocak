import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

/**
 * Push bildirimi payload'ı
 */
export interface PushPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

/**
 * Push gönderim sonucu
 */
export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Push Service
 * 
 * Firebase Cloud Messaging (FCM) ile push notification gönderimi
 * 
 * Özellikler:
 * - Tek kullanıcıya gönderim
 * - Çoklu kullanıcıya gönderim (batch)
 * - Topic'e gönderim
 * - Token yönetimi
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private isInitialized = false;

  // In-memory token cache (production'da Redis kullanılmalı)
  private tokenCache: Map<string, { tokens: Map<string, string> }> = new Map();

  constructor(private configService: ConfigService) {}

  /**
   * Modül başlatıldığında Firebase'i initialize et
   */
  async onModuleInit() {
    try {
      const fcmConfig = this.configService.get('fcm');

      if (!fcmConfig?.projectId) {
        this.logger.warn('Firebase yapılandırması eksik, push bildirimleri devre dışı');
        return;
      }

      // Firebase Admin SDK'yı initialize et
      if (!admin.apps.length) {
        const credential = fcmConfig.serviceAccount
          ? admin.credential.cert(fcmConfig.serviceAccount)
          : fcmConfig.serviceAccountPath
            ? admin.credential.cert(require(fcmConfig.serviceAccountPath))
            : admin.credential.applicationDefault();

        admin.initializeApp({
          credential,
          projectId: fcmConfig.projectId,
        });
      }

      this.isInitialized = true;
      this.logger.log('Firebase Admin SDK başarıyla initialize edildi');
    } catch (error) {
      this.logger.error('Firebase initialize hatası:', error);
    }
  }

  /**
   * Kullanıcıya push bildirim gönder
   */
  async send(userId: string, payload: PushPayload): Promise<PushResult[]> {
    if (!this.isInitialized) {
      this.logger.warn('Firebase initialize edilmedi, bildirim gönderilmedi');
      return [{ success: false, error: 'Firebase not initialized' }];
    }

    // Kullanıcının token'larını al
    const tokens = await this.getUserTokens(userId);

    if (tokens.length === 0) {
      this.logger.debug(`Kullanıcının FCM token'ı yok: ${userId}`);
      return [{ success: false, error: 'No tokens found' }];
    }

    const results: PushResult[] = [];
    const fcmConfig = this.configService.get('fcm');

    for (const token of tokens) {
      try {
        const message: admin.messaging.Message = {
          token,
          notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: payload.imageUrl,
          },
          data: payload.data,
          android: fcmConfig?.defaults?.android,
          apns: fcmConfig?.defaults?.apns,
          webpush: fcmConfig?.defaults?.webpush,
        };

        const response = await admin.messaging().send(message);
        
        results.push({
          success: true,
          messageId: response,
        });

        this.logger.debug(`Push gönderildi: userId=${userId}, messageId=${response}`);
      } catch (error) {
        this.logger.error(`Push gönderim hatası: userId=${userId}`, error);
        
        // Geçersiz token'ı temizle
        if (this.isInvalidTokenError(error)) {
          await this.removeInvalidToken(userId, token);
        }

        results.push({
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Birden fazla kullanıcıya push bildirim gönder (batch)
   */
  async sendToMultiple(
    userIds: string[],
    payload: PushPayload,
  ): Promise<Map<string, PushResult[]>> {
    const results = new Map<string, PushResult[]>();

    // Paralel gönderim (batch size'a göre grupla)
    const batchSize = this.configService.get('fcm.batch.maxSize', 500);
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (userId) => {
        const result = await this.send(userId, payload);
        results.set(userId, result);
      });

      await Promise.all(batchPromises);

      // Batch'ler arası gecikme
      if (i + batchSize < userIds.length) {
        const delay = this.configService.get('fcm.batch.delayBetweenBatches', 100);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  /**
   * Topic'e push bildirim gönder
   */
  async sendToTopic(topic: string, payload: PushPayload): Promise<PushResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const fcmConfig = this.configService.get('fcm');
      
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: fcmConfig?.defaults?.android,
        apns: fcmConfig?.defaults?.apns,
      };

      const response = await admin.messaging().send(message);
      
      this.logger.log(`Topic'e push gönderildi: topic=${topic}, messageId=${response}`);
      
      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      this.logger.error(`Topic push hatası: topic=${topic}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * FCM token kaydet
   */
  async registerToken(
    userId: string,
    token: string,
    deviceId: string,
    platform: string,
  ): Promise<void> {
    // Cache'e ekle (production'da Redis/DB'ye kaydet)
    if (!this.tokenCache.has(userId)) {
      this.tokenCache.set(userId, { tokens: new Map() });
    }

    this.tokenCache.get(userId).tokens.set(deviceId, token);
    
    this.logger.debug(
      `Token kaydedildi: userId=${userId}, deviceId=${deviceId}, platform=${platform}`,
    );
  }

  /**
   * FCM token sil
   */
  async removeToken(userId: string, deviceId: string): Promise<void> {
    const userTokens = this.tokenCache.get(userId);
    
    if (userTokens) {
      userTokens.tokens.delete(deviceId);
      
      if (userTokens.tokens.size === 0) {
        this.tokenCache.delete(userId);
      }
    }

    this.logger.debug(`Token silindi: userId=${userId}, deviceId=${deviceId}`);
  }

  /**
   * Kullanıcıyı topic'e abone yap
   */
  async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await admin.messaging().subscribeToTopic(token, topic);
      this.logger.debug(`Topic aboneliği eklendi: topic=${topic}`);
      return true;
    } catch (error) {
      this.logger.error(`Topic abonelik hatası: topic=${topic}`, error);
      return false;
    }
  }

  /**
   * Kullanıcıyı topic'ten çıkar
   */
  async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await admin.messaging().unsubscribeFromTopic(token, topic);
      this.logger.debug(`Topic aboneliği kaldırıldı: topic=${topic}`);
      return true;
    } catch (error) {
      this.logger.error(`Topic abonelik kaldırma hatası: topic=${topic}`, error);
      return false;
    }
  }

  /**
   * Kullanıcının FCM token'larını al
   */
  private async getUserTokens(userId: string): Promise<string[]> {
    // Production'da user-service'e HTTP call yapılacak
    // veya Redis/DB'den okunacak
    const userTokens = this.tokenCache.get(userId);
    
    if (!userTokens) {
      return [];
    }

    return Array.from(userTokens.tokens.values());
  }

  /**
   * Geçersiz token hatası mı kontrol et
   */
  private isInvalidTokenError(error: any): boolean {
    const invalidTokenCodes = [
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
    ];

    return invalidTokenCodes.includes(error?.code);
  }

  /**
   * Geçersiz token'ı temizle
   */
  private async removeInvalidToken(userId: string, token: string): Promise<void> {
    const userTokens = this.tokenCache.get(userId);
    
    if (userTokens) {
      // Token'ı deviceId ile eşleştirip sil
      for (const [deviceId, storedToken] of userTokens.tokens.entries()) {
        if (storedToken === token) {
          userTokens.tokens.delete(deviceId);
          this.logger.log(`Geçersiz token temizlendi: userId=${userId}, deviceId=${deviceId}`);
          break;
        }
      }
    }
  }
}
