import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatingModule } from './dating.module';
import configuration from './config';

@Module({
  imports: [
    // Config modülü
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // MongoDB bağlantısı
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        dbName: configService.get<string>('database.name'),
      }),
      inject: [ConfigService],
    }),

    // Dating modülü
    DatingModule,
  ],
})
export class AppModule {}
