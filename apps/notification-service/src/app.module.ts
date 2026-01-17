import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from './notification.module';
import appConfig from './config';

/**
 * Ana Uygulama Modülü
 * Tüm modülleri ve global ayarları birleştirir
 */
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
        // Bağlantı havuzu ayarları
        maxPoolSize: 10,
        minPoolSize: 2,
        // Zaman aşımı ayarları
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        // Yeniden bağlanma ayarları
        retryWrites: true,
        retryReads: true,
      }),
      inject: [ConfigService],
    }),

    // Zamanlanmış görevler modülü (digest bildirimleri için)
    ScheduleModule.forRoot(),

    // Notification modülü
    NotificationModule,
  ],
})
export class AppModule {}
