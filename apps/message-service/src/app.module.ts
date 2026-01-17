/**
 * App Module
 * Message Service ana modülü - tüm modülleri birleştirir
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageModule } from './message.module';
import { HealthModule } from './health/health.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import socketConfig from './config/socket.config';

@Module({
  imports: [
    // Konfigürasyon modülü
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, socketConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // MongoDB bağlantısı
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        dbName: configService.get<string>('database.name'),
        // Bağlantı havuzu ayarları
        maxPoolSize: 10,
        minPoolSize: 5,
        // Timeout ayarları
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        // Retry ayarları
        retryWrites: true,
        retryReads: true,
      }),
    }),

    // Mesajlaşma modülü
    MessageModule,

    // Health check modülü
    HealthModule,
  ],
})
export class AppModule {}
