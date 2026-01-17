import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';
import {
  NotificationSettings,
  NotificationSettingsDocument,
} from '../schemas/notification-settings.schema';
import { EmailService } from './email.service';

/**
 * Digest türleri
 */
export enum DigestType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

/**
 * Digest içeriği
 */
export interface DigestContent {
  userId: string;
  email: string;
  displayName: string;
  period: {
    start: Date;
    end: Date;
  };
  stats: {
    totalNotifications: number;
    likes: number;
    comments: number;
    follows: number;
    messages: number;
  };
  highlights: Array<{
    type: string;
    content: string;
    createdAt: Date;
  }>;
}

/**
 * Digest Service
 * 
 * Periyodik bildirim özeti emaili gönderimi
 * 
 * Özellikler:
 * - Günlük özet (isteğe bağlı)
 * - Haftalık özet
 * - Önemli bildirimleri öne çıkarma
 */
@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationSettings.name)
    private settingsModel: Model<NotificationSettingsDocument>,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  /**
   * Günlük özet gönderimi (her gün saat 09:00'da)
   */
  @Cron('0 9 * * *', {
    name: 'daily-digest',
    timeZone: 'Europe/Istanbul',
  })
  async sendDailyDigests(): Promise<void> {
    this.logger.log('Günlük özet gönderimi başladı...');

    try {
      const users = await this.getUsersWithDigestEnabled(DigestType.DAILY);
      this.logger.log(`Günlük özet gönderilecek kullanıcı sayısı: ${users.length}`);

      let sentCount = 0;

      for (const user of users) {
        const digest = await this.generateDigest(
          user.userId.toString(),
          DigestType.DAILY,
        );

        if (digest && digest.stats.totalNotifications > 0) {
          const success = await this.sendDigestEmail(digest);
          if (success) sentCount++;
        }
      }

      this.logger.log(`Günlük özet gönderimi tamamlandı: ${sentCount} email gönderildi`);
    } catch (error) {
      this.logger.error('Günlük özet gönderim hatası:', error);
    }
  }

  /**
   * Haftalık özet gönderimi (her Pazartesi saat 09:00'da)
   */
  @Cron('0 9 * * 1', {
    name: 'weekly-digest',
    timeZone: 'Europe/Istanbul',
  })
  async sendWeeklyDigests(): Promise<void> {
    this.logger.log('Haftalık özet gönderimi başladı...');

    try {
      const users = await this.getUsersWithDigestEnabled(DigestType.WEEKLY);
      this.logger.log(`Haftalık özet gönderilecek kullanıcı sayısı: ${users.length}`);

      let sentCount = 0;

      for (const user of users) {
        const digest = await this.generateDigest(
          user.userId.toString(),
          DigestType.WEEKLY,
        );

        if (digest && digest.stats.totalNotifications >= 3) {
          const success = await this.sendDigestEmail(digest);
          if (success) sentCount++;
        }
      }

      this.logger.log(`Haftalık özet gönderimi tamamlandı: ${sentCount} email gönderildi`);
    } catch (error) {
      this.logger.error('Haftalık özet gönderim hatası:', error);
    }
  }

  /**
   * Kullanıcı için özet oluştur
   */
  async generateDigest(
    userId: string,
    type: DigestType,
  ): Promise<DigestContent | null> {
    const now = new Date();
    const startDate = new Date();

    if (type === DigestType.DAILY) {
      startDate.setDate(startDate.getDate() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    // Bildirimleri al
    const notifications = await this.notificationModel.find({
      userId: new Types.ObjectId(userId),
      createdAt: { $gte: startDate, $lt: now },
    }).lean();

    if (notifications.length === 0) {
      return null;
    }

    // İstatistikleri hesapla
    const stats = {
      totalNotifications: notifications.length,
      likes: notifications.filter((n) => n.type === 'like').length,
      comments: notifications.filter(
        (n) => n.type === 'comment' || n.type === 'reply',
      ).length,
      follows: notifications.filter(
        (n) => n.type === 'follow' || n.type === 'follow_accepted',
      ).length,
      messages: notifications.filter((n) => n.type === 'message').length,
    };

    // Önemli bildirimleri seç (en son 5 tanesi)
    const highlights = notifications
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((n) => ({
        type: n.type,
        content: n.content.body,
        createdAt: n.createdAt,
      }));

    return {
      userId,
      email: '', // TODO: User service'den alınacak
      displayName: '', // TODO: User service'den alınacak
      period: {
        start: startDate,
        end: now,
      },
      stats,
      highlights,
    };
  }

  /**
   * Özet emaili gönder
   */
  private async sendDigestEmail(digest: DigestContent): Promise<boolean> {
    if (!digest.email) {
      this.logger.debug(`Email adresi yok: userId=${digest.userId}`);
      return false;
    }

    try {
      const html = this.generateDigestHtml(digest);

      const success = await this.emailService.send({
        to: digest.email,
        subject: `Haftalık Özetiniz - ${this.formatDate(digest.period.start)} - ${this.formatDate(digest.period.end)}`,
        html,
      });

      if (success) {
        this.logger.debug(`Özet emaili gönderildi: userId=${digest.userId}`);
      }

      return success;
    } catch (error) {
      this.logger.error(`Özet email gönderim hatası: userId=${digest.userId}`, error);
      return false;
    }
  }

  /**
   * Özet HTML'i oluştur
   */
  private generateDigestHtml(digest: DigestContent): string {
    const { stats, highlights, period, displayName } = digest;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Haftalık Özet</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .stats { display: flex; justify-content: space-around; padding: 20px 0; background: #f5f5f5; border-radius: 8px; margin: 20px 0; }
          .stat-item { text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #007bff; }
          .stat-label { font-size: 12px; color: #666; }
          .highlights { padding: 20px 0; }
          .highlight-item { padding: 10px; border-left: 3px solid #007bff; margin-bottom: 10px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Merhaba ${displayName || 'Kullanıcı'}! 👋</h1>
            <p>${this.formatDate(period.start)} - ${this.formatDate(period.end)} arası aktiviteleriniz</p>
          </div>
          
          <div class="stats">
            <div class="stat-item">
              <div class="stat-number">${stats.totalNotifications}</div>
              <div class="stat-label">Toplam Bildirim</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${stats.likes}</div>
              <div class="stat-label">Beğeni</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${stats.comments}</div>
              <div class="stat-label">Yorum</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${stats.follows}</div>
              <div class="stat-label">Takipçi</div>
            </div>
          </div>
          
          ${
            highlights.length > 0
              ? `
            <div class="highlights">
              <h3>Öne Çıkanlar</h3>
              ${highlights
                .map(
                  (h) => `
                <div class="highlight-item">
                  <strong>${this.getTypeLabel(h.type)}</strong>
                  <p>${h.content}</p>
                  <small>${this.formatDateTime(h.createdAt)}</small>
                </div>
              `,
                )
                .join('')}
            </div>
          `
              : ''
          }
          
          <div class="footer">
            <p>Bu emaili almak istemiyorsanız, <a href="{{unsubscribeUrl}}">ayarlarınızdan</a> değiştirebilirsiniz.</p>
            <p>© ${new Date().getFullYear()} SuperApp</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Digest ayarı açık kullanıcıları al
   */
  private async getUsersWithDigestEnabled(
    type: DigestType,
  ): Promise<NotificationSettings[]> {
    // TODO: Digest ayarı için ayrı bir alan eklenebilir
    // Şimdilik email bildirimi açık olanları al
    return this.settingsModel.find({
      'channels.email': true,
    });
  }

  /**
   * Tarih formatla
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * Tarih ve saat formatla
   */
  private formatDateTime(date: Date): string {
    return date.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Bildirim tipi etiketi
   */
  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      like: '❤️ Beğeni',
      comment: '💬 Yorum',
      reply: '↩️ Yanıt',
      follow: '👤 Takip',
      follow_accepted: '✅ Takip Onayı',
      mention: '📢 Etiket',
      repost: '🔄 Paylaşım',
      message: '✉️ Mesaj',
      match: '💕 Eşleşme',
    };

    return labels[type] || '📌 Bildirim';
  }
}
