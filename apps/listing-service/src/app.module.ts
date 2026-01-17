import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ListingModule } from './listing.module';
import appConfig from './config';

@Module({
  imports: [
    // Konfigürasyon
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // MongoDB bağlantısı
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/superapp'),

    // Ana modül
    ListingModule,
  ],
})
export class AppModule {}
