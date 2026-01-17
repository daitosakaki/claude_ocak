/**
 * Presence Service
 * Kullanıcı online/offline durum yönetimi
 * Redis ile çalışır
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly onlineTTL: number;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.onlineTTL = this.configService.get<number>('redis.ttl.online', 60);
  }

  /**
   * Kullanıcıyı online yap
   */
  async setOnline(userId: string, socketId: string): Promise<void> {
    const key = this.getOnlineKey(userId);

    const data = {
      socketId,
      instanceId: process.env.INSTANCE_ID || 'local',
      connectedAt: new Date().toISOString(),
    };

    // Hash olarak kaydet ve TTL ata
    await this.redis.hset(key, data);
    await this.redis.expire(key, this.onlineTTL);

    // Socket -> User mapping
    const socketKey = this.getSocketKey(socketId);
    await this.redis.set(socketKey, userId, 'EX', 86400); // 1 gün

    this.logger.debug(`User online: ${userId} (Socket: ${socketId})`);
  }

  /**
   * Kullanıcıyı offline yap
   */
  async setOffline(userId: string, socketId: string): Promise<void> {
    const key = this.getOnlineKey(userId);
    const socketKey = this.getSocketKey(socketId);

    // Mevcut socket ID'yi kontrol et (farklı bir cihazdan bağlıysa silme)
    const currentSocketId = await this.redis.hget(key, 'socketId');

    if (currentSocketId === socketId) {
      await this.redis.del(key);
      this.logger.debug(`User offline: ${userId}`);
    }

    // Socket mapping'i sil
    await this.redis.del(socketKey);
  }

  /**
   * Kullanıcının online olup olmadığını kontrol et
   */
  async isOnline(userId: string): Promise<boolean> {
    const key = this.getOnlineKey(userId);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Online durumunu yenile (heartbeat)
   */
  async refreshOnline(userId: string): Promise<void> {
    const key = this.getOnlineKey(userId);
    await this.redis.expire(key, this.onlineTTL);
  }

  /**
   * Kullanıcının online bilgisini getir
   */
  async getOnlineInfo(
    userId: string,
  ): Promise<{ socketId: string; instanceId: string; connectedAt: string } | null> {
    const key = this.getOnlineKey(userId);
    const data = await this.redis.hgetall(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      socketId: data.socketId,
      instanceId: data.instanceId,
      connectedAt: data.connectedAt,
    };
  }

  /**
   * Socket ID'den user ID'yi getir
   */
  async getUserIdBySocket(socketId: string): Promise<string | null> {
    const socketKey = this.getSocketKey(socketId);
    return this.redis.get(socketKey);
  }

  /**
   * Birden fazla kullanıcının online durumunu getir
   */
  async getMultipleOnlineStatus(
    userIds: string[],
  ): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();

    if (userIds.length === 0) return result;

    // Pipeline ile toplu sorgu
    const pipeline = this.redis.pipeline();
    userIds.forEach((userId) => {
      pipeline.exists(this.getOnlineKey(userId));
    });

    const responses = await pipeline.exec();

    userIds.forEach((userId, index) => {
      const exists = responses?.[index]?.[1] === 1;
      result.set(userId, exists);
    });

    return result;
  }

  /**
   * Son görülme zamanını kaydet
   */
  async setLastSeen(userId: string): Promise<void> {
    const key = `lastseen:${userId}`;
    await this.redis.set(key, new Date().toISOString());
  }

  /**
   * Son görülme zamanını getir
   */
  async getLastSeen(userId: string): Promise<string | null> {
    const key = `lastseen:${userId}`;
    return this.redis.get(key);
  }

  // ==================== HELPER METHODS ====================

  private getOnlineKey(userId: string): string {
    return `online:${userId}`;
  }

  private getSocketKey(socketId: string): string {
    return `socket:${socketId}`;
  }
}
