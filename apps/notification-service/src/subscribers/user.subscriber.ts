import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationService, NotificationType } from '../notification.service';
import { EmailService } from '../services/email.service';

/**
 * User Events Subscriber
 * 
 * Pub/Sub user-events topic'ini dinler
 * 
 * Events:
 * - user.created: Hoş geldin emaili gönder
 * - user.followed: Takip bildirimi gönder
 * - user.follow_request: Takip isteği bildirimi gönder
 * - user.follow_accepted: Takip kabul bildirimi gönder
 * - user.blocked: İsteğe bağlı bildirim
 */
@Injectable()
export class UserSubscriber implements OnModuleInit {
  private readonly logger = new Logger(UserSubscriber.name);

  constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
    private emailService: EmailService,
  ) {}

  /**
   * Modül başlatıldığında subscription'ı başlat
   */
  async onModuleInit() {
    // TODO: GCP Pub/Sub subscription kurulumu
    // const subscriptionName = this.configService.get('app.pubsub.subscriptions.userEvents');
    this.logger.log('User events subscriber başlatıldı');
  }

  /**
   * Gelen mesajı işle
   */
  async handleMessage(message: any): Promise<void> {
    const { event, data } = message;

    this.logger.debug(`User event alındı: ${event}`);

    try {
      switch (event) {
        case 'user.created':
          await this.handleUserCreated(data);
          break;
        case 'user.followed':
          await this.handleUserFollowed(data);
          break;
        case 'user.follow_request':
          await this.handleFollowRequest(data);
          break;
        case 'user.follow_accepted':
          await this.handleFollowAccepted(data);
          break;
        default:
          this.logger.debug(`Bilinmeyen user event: ${event}`);
      }
    } catch (error) {
      this.logger.error(`User event işleme hatası: ${event}`, error);
    }
  }

  /**
   * Yeni kullanıcı oluşturuldu
   */
  private async handleUserCreated(data: {
    userId: string;
    email: string;
    displayName: string;
    verificationUrl?: string;
  }): Promise<void> {
    const { email, displayName, verificationUrl } = data;

    // Hoş geldin emaili gönder
    await this.emailService.sendWelcomeEmail(email, {
      displayName,
      verificationUrl,
    });

    this.logger.log(`Hoş geldin emaili gönderildi: ${email}`);
  }

  /**
   * Kullanıcı takip edildi
   */
  private async handleUserFollowed(data: {
    followerId: string;
    followedId: string;
    followerName: string;
    followerAvatar?: string;
  }): Promise<void> {
    const { followerId, followedId, followerName, followerAvatar } = data;

    await this.notificationService.create({
      userId: followedId,
      actorId: followerId,
      type: NotificationType.FOLLOW,
      target: {
        type: 'user',
        id: followerId,
      },
      content: {
        title: 'Yeni Takipçi',
        body: `${followerName} seni takip etmeye başladı`,
        imageUrl: followerAvatar,
      },
      sendPush: true,
    });

    this.logger.debug(`Takip bildirimi gönderildi: ${followedId}`);
  }

  /**
   * Takip isteği gönderildi (private hesap için)
   */
  private async handleFollowRequest(data: {
    requesterId: string;
    targetId: string;
    requesterName: string;
    requesterAvatar?: string;
  }): Promise<void> {
    const { requesterId, targetId, requesterName, requesterAvatar } = data;

    await this.notificationService.create({
      userId: targetId,
      actorId: requesterId,
      type: NotificationType.FOLLOW_REQUEST,
      target: {
        type: 'user',
        id: requesterId,
      },
      content: {
        title: 'Takip İsteği',
        body: `${requesterName} seni takip etmek istiyor`,
        imageUrl: requesterAvatar,
      },
      sendPush: true,
    });

    this.logger.debug(`Takip isteği bildirimi gönderildi: ${targetId}`);
  }

  /**
   * Takip isteği kabul edildi
   */
  private async handleFollowAccepted(data: {
    accepterId: string;
    requesterId: string;
    accepterName: string;
    accepterAvatar?: string;
  }): Promise<void> {
    const { accepterId, requesterId, accepterName, accepterAvatar } = data;

    await this.notificationService.create({
      userId: requesterId,
      actorId: accepterId,
      type: NotificationType.FOLLOW_ACCEPTED,
      target: {
        type: 'user',
        id: accepterId,
      },
      content: {
        title: 'Takip İsteği Kabul Edildi',
        body: `${accepterName} takip isteğini kabul etti`,
        imageUrl: accepterAvatar,
      },
      sendPush: true,
    });

    this.logger.debug(`Takip kabul bildirimi gönderildi: ${requesterId}`);
  }
}
