import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user.module';
import { LoggerModule } from '@superapp/shared-logger';
import { PubSubModule } from '@superapp/shared-pubsub';
import { RedisModule } from '@superapp/shared-database';
import appConfig from './config';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Logger
    LoggerModule.forRoot({
      serviceName: 'user-service',
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        dbName: configService.get<string>('database.name'),
        retryWrites: true,
        w: 'majority',
      }),
      inject: [ConfigService],
    }),

    // Redis
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        host: configService.get<string>('redis.host'),
        port: configService.get<number>('redis.port'),
        password: configService.get<string>('redis.password'),
      }),
      inject: [ConfigService],
    }),

    // Pub/Sub
    PubSubModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        projectId: configService.get<string>('pubsub.projectId'),
      }),
      inject: [ConfigService],
    }),

    // User Module
    UserModule,
  ],
})
export class AppModule {}
