import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedModule } from './feed.module';
import appConfig from './config';

/**
 * Feed Service - Ana modül
 * Tüm bağımlılıkları ve alt modülleri yapılandırır
 */
@Module({
  imports: [
    // Konfigürasyon
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env', '.env.local'],
    }),

    // MongoDB bağlantısı
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('MONGODB_DB_NAME', 'superapp'),
        // Connection options
        retryWrites: true,
        w: 'majority',
        // Connection pool
        maxPoolSize: 10,
        minPoolSize: 5,
        // Timeouts
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
      inject: [ConfigService],
    }),

    // Feed modülü
    FeedModule,
  ],
})
export class AppModule {}
