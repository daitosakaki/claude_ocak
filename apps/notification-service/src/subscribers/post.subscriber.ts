import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationService, NotificationType } from '../notification.service';

/**
 * Post Events Subscriber
 * 
 * Pub/Sub post-events topic'ini dinler
 * 
 * Events:
 * - post.created: Etiketlenen kullanıcılara bildirim gönder
 * - post.deleted: İlgili bildirimleri temizle (opsiyonel)
 */
@Injectable()
export class PostSubscriber implements OnModuleInit {
  private readonly logger = new Logger(PostSubscriber.name);

  constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Modül başlatıldığında subscription'ı başlat
   */
  async onModuleInit() {
    // TODO: GCP Pub/Sub subscription kurulumu
    // const subscriptionName = this.configService.get('app.pubsub.subscriptions.postEvents');
    this.logger.log('Post events subscriber başlatıldı');
  }

  /**
   * Gelen mesajı işle
   */
  async handleMessage(message: any): Promise<void> {
    const { event, data } = message;

    this.logger.debug(`Post event alındı: ${event}`);

    try {
      switch (event) {
        case 'post.created':
          await this.handlePostCreated(data);
          break;
        case 'post.deleted':
          await this.handlePostDeleted(data);
          break;
        default:
          this.logger.debug(`Bilinmeyen post event: ${event}`);
      }
    } catch (error) {
      this.logger.error(`Post event işleme hatası: ${event}`, error);
    }
  }

  /**
   * Post oluşturuldu - etiketlenen kullanıcılara bildirim gönder
   */
  private async handlePostCreated(data: {
    postId: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    mentions: string[]; // Etiketlenen kullanıcı ID'leri
    content: string;
  }): Promise<void> {
    const { postId, authorId, authorName, authorAvatar, mentions, content } = data;

    if (!mentions || mentions.length === 0) {
      return;
    }

    // Her etiketlenen kullanıcıya bildirim gönder
    const truncatedContent = content.length > 50 
      ? content.substring(0, 50) + '...' 
      : content;

    for (const userId of mentions) {
      // Kendi kendini etiketlediyse bildirim gönderme
      if (userId === authorId) {
        continue;
      }

      await this.notificationService.create({
        userId,
        actorId: authorId,
        type: NotificationType.MENTION,
        target: {
          type: 'post',
          id: postId,
        },
        content: {
          title: 'Bir gönderide etiketlendiniz',
          body: `${authorName} seni bir gönderide etiketledi: "${truncatedContent}"`,
          imageUrl: authorAvatar,
        },
        data: {
          postId,
          authorId,
        },
        sendPush: true,
      });

      this.logger.debug(`Etiket bildirimi gönderildi: userId=${userId}, postId=${postId}`);
    }
  }

  /**
   * Post silindi - ilgili bildirimleri temizle (opsiyonel)
   */
  private async handlePostDeleted(data: {
    postId: string;
  }): Promise<void> {
    const { postId } = data;

    // İsteğe bağlı: Post silindiğinde o post'a ait bildirimleri de silebiliriz
    // Bu özellik performans ve UX açısından değerlendirilmeli
    
    this.logger.debug(`Post silindi event alındı: postId=${postId}`);
    
    // Bildirimleri silme kodu (opsiyonel):
    // await this.inAppService.deleteForTarget('post', postId);
  }
}
