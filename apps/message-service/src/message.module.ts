/**
 * Message Module
 * Mesajlaşma özelliklerini içeren ana modül
 * - HTTP controller (REST API)
 * - WebSocket gateway (real-time)
 * - Alt servisler (conversation, message, presence, typing, delivery)
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controllers & Gateways
import { MessageController } from './message.controller';
import { MessageGateway } from './message.gateway';

// Services
import { MessageService } from './message.service';
import { ConversationService } from './services/conversation.service';
import { MessageCrudService } from './services/message-crud.service';
import { PresenceService } from './services/presence.service';
import { TypingService } from './services/typing.service';
import { DeliveryService } from './services/delivery.service';

// Schemas
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import {
  MessagingSettings,
  MessagingSettingsSchema,
} from './schemas/messaging-settings.schema';

// Events
import { MessagePublisher } from './events/message.publisher';

// Redis service
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    // MongoDB şemaları
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: MessagingSettings.name, schema: MessagingSettingsSchema },
    ]),

    // JWT modülü (token doğrulama için)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),

    // Redis modülü
    RedisModule,
  ],
  controllers: [MessageController],
  providers: [
    // Gateway
    MessageGateway,

    // Ana servis
    MessageService,

    // Alt servisler
    ConversationService,
    MessageCrudService,
    PresenceService,
    TypingService,
    DeliveryService,

    // Event publisher
    MessagePublisher,
  ],
  exports: [MessageService, ConversationService],
})
export class MessageModule {}
