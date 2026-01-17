import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

import { AdminModule } from './admin.module';
import { HealthModule } from './health/health.module';
import appConfig from './config';

@Module({
  imports: [
    // Konfigürasyon modülü
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // MongoDB bağlantısı
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('MONGODB_DB_NAME', 'superapp'),
        // Connection options
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ([
        {
          name: 'short',
          ttl: 1000, // 1 saniye
          limit: 10, // 10 istek
        },
        {
          name: 'medium',
          ttl: 60000, // 1 dakika
          limit: 100, // 100 istek
        },
        {
          name: 'long',
          ttl: 3600000, // 1 saat
          limit: 1000, // 1000 istek
        },
      ]),
      inject: [ConfigService],
    }),

    // Admin modülü
    AdminModule,

    // Health check modülü
    HealthModule,
  ],
})
export class AppModule {}
