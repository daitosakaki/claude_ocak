/**
 * Typing Service
 * "Yazıyor..." göstergesi yönetimi
 * Redis ile 3 saniyelik TTL
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class TypingService {
  private readonly logger = new Logger(TypingService.name);
  private readonly typingTTL: number;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.typingTTL = this.configService.get<number>('redis.ttl.typing', 3);
  }

  /**
   * Yazıyor durumunu başlat
   */
  async startTyping(conversationId: string, userId: string): Promise<void> {
    const key = this.getTypingKey(conversationId, userId);
    await this.redis.set(key, '1', 'EX', this.typingTTL);
    this.logger.debug(`Typing started: ${userId} in ${conversationId}`);
  }

  /**
   * Yazıyor durumunu durdur
   */
  async stopTyping(conversationId: string, userId: string): Promise<void> {
    const key = this.getTypingKey(conversationId, userId);
    await this.redis.del(key);
    this.logger.debug(`Typing stopped: ${userId} in ${conversationId}`);
  }

  /**
   * Kullanıcının yazıp yazmadığını kontrol et
   */
  async isTyping(conversationId: string, userId: string): Promise<boolean> {
    const key = this.getTypingKey(conversationId, userId);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Sohbetteki yazıyor durumundaki kullanıcıları getir
   */
  async getTypingUsers(conversationId: string): Promise<string[]> {
    // Pattern ile tüm typing key'lerini bul
    const pattern = `typing:${conversationId}:*`;
    const keys = await this.redis.keys(pattern);

    // User ID'lerini çıkar
    const userIds = keys.map((key) => {
      const parts = key.split(':');
      return parts[parts.length - 1];
    });

    return userIds;
  }

  /**
   * Yazıyor durumunu yenile (client her 2 saniyede bir çağırmalı)
   */
  async refreshTyping(conversationId: string, userId: string): Promise<void> {
    const key = this.getTypingKey(conversationId, userId);
    const exists = await this.redis.exists(key);

    if (exists) {
      await this.redis.expire(key, this.typingTTL);
    } else {
      await this.startTyping(conversationId, userId);
    }
  }

  /**
   * Kullanıcının tüm sohbetlerdeki yazıyor durumunu temizle
   * (Disconnect durumunda kullanılır)
   */
  async clearAllTyping(userId: string): Promise<void> {
    const pattern = `typing:*:${userId}`;
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
      this.logger.debug(`Cleared typing for user: ${userId} (${keys.length} keys)`);
    }
  }

  // ==================== HELPER METHODS ====================

  private getTypingKey(conversationId: string, userId: string): string {
    return `typing:${conversationId}:${userId}`;
  }
}
