import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { NotificationController } from './notification.controller';

// Services
import { NotificationService } from './notification.service';
import { PushService } from './services/push.service';
import { EmailService } from './services/email.service';
import { InAppService } from './services/in-app.service';
import { DigestService } from './services/digest.service';

// Schemas
import { Notification, NotificationSchema } from './schemas/notification.schema';
import {
  NotificationSettings,
  NotificationSettingsSchema,
} from './schemas/notification-settings.schema';

// Subscribers
import { UserSubscriber } from './subscribers/user.subscriber';
import { PostSubscriber } from './subscribers/post.subscriber';
import { InteractionSubscriber } from './subscribers/interaction.subscriber';
import { MessageSubscriber } from './subscribers/message.subscriber';

// Config
import fcmConfig from './config/fcm.config';
import emailConfig from './config/email.config';

/**
 * Notification Modülü
 * 
 * Sorumluluklar:
 * - Push notifications (FCM)
 * - Email notifications (SendGrid/AWS SES)
 * - In-app notifications
 * - Notification preferences check
 * - Batch/digest notifications
 * - Notification history
 * 
 * Pub/Sub Subscriptions:
 * - user-events (user.created, user.followed)
 * - post-events (post.created - mentions için)
 * - interaction-events (post.liked, post.commented, post.reposted)
 * - message-events (message.sent - offline user için)
 */
@Module({
  imports: [
    // Konfigürasyonlar
    ConfigModule.forFeature(fcmConfig),
    ConfigModule.forFeature(emailConfig),

    // MongoDB şemaları
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationSettings.name, schema: NotificationSettingsSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    // Ana servis
    NotificationService,

    // Alt servisler
    PushService,
    EmailService,
    InAppService,
    DigestService,

    // Pub/Sub subscribers
    UserSubscriber,
    PostSubscriber,
    InteractionSubscriber,
    MessageSubscriber,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
