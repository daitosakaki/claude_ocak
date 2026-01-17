import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth.module';
import { jwtConfig, databaseConfig } from './config';

/**
 * App Module
 *
 * Root module - tüm diğer modülleri import eder.
 */
@Module({
  imports: [
    // ==================== Config Module ====================
    // Environment variables ve config dosyaları
    ConfigModule.forRoot({
      isGlobal: true, // Her yerde erişilebilir
      cache: true, // Config değerlerini cache'le
      load: [jwtConfig, databaseConfig],
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
    }),

    // ==================== MongoDB ====================
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('MONGODB_DB_NAME'),
        retryWrites: true,
        w: 'majority',
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
      inject: [ConfigService],
    }),

    // ==================== Feature Modules ====================
    AuthModule,
  ],
})
export class AppModule {}
