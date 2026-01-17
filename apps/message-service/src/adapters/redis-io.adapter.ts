/**
 * Redis IO Adapter
 * Multi-instance WebSocket desteği için Redis pub/sub kullanır
 * Birden fazla Cloud Run instance'ı arasında socket event'lerini senkronize eder
 */

import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplication, Logger } from '@nestjs/common';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(app: INestApplication) {
    super(app);
  }

  /**
   * Redis'e bağlan ve adapter'ı hazırla
   */
  async connectToRedis(config: RedisConfig): Promise<void> {
    const redisUrl = config.password
      ? `redis://:${config.password}@${config.host}:${config.port}`
      : `redis://${config.host}:${config.port}`;

    // Pub/Sub için iki ayrı client gerekli
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    // Hata yakalama
    pubClient.on('error', (err) => {
      this.logger.error(`Redis Pub Client hatası: ${err.message}`);
    });

    subClient.on('error', (err) => {
      this.logger.error(`Redis Sub Client hatası: ${err.message}`);
    });

    // Bağlantıları aç
    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.logger.log('✅ Redis adapter bağlantısı kuruldu');

    // Socket.IO Redis adapter'ını oluştur
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  /**
   * Socket.IO server oluştur
   */
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingInterval: 25000, // 25 saniye
      pingTimeout: 20000, // 20 saniye
      transports: ['websocket', 'polling'],
    });

    // Redis adapter'ı kullan
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }
}
