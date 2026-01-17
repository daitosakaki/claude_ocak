import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

// Email templates
import { getWelcomeTemplate } from '../templates/welcome.template';
import { getResetPasswordTemplate } from '../templates/reset-password.template';
import { getVerifyEmailTemplate } from '../templates/verify-email.template';

/**
 * Email gönderim parametreleri
 */
export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Template ile email gönderim parametreleri
 */
export interface SendTemplateEmailParams {
  to: string;
  template: 'welcome' | 'verifyEmail' | 'resetPassword' | 'notification' | 'digest';
  data: Record<string, any>;
  subject?: string;
}

/**
 * Bildirim email parametreleri
 */
export interface NotificationEmailParams {
  type: string;
  title: string;
  body: string;
}

/**
 * Email Service
 * 
 * Email gönderimi için servis
 * Desteklenen provider'lar: SMTP, SendGrid, AWS SES
 * 
 * Özellikler:
 * - Template tabanlı email gönderimi
 * - HTML ve plain text desteği
 * - Attachment desteği
 * - Rate limiting
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {}

  /**
   * Modül başlatıldığında transporter'ı oluştur
   */
  async onModuleInit() {
    const emailConfig = this.configService.get('email');
    const provider = emailConfig?.provider || 'smtp';

    try {
      switch (provider) {
        case 'sendgrid':
          this.transporter = this.createSendGridTransport(emailConfig);
          break;
        case 'ses':
          this.transporter = this.createSESTransport(emailConfig);
          break;
        case 'smtp':
        default:
          this.transporter = this.createSMTPTransport(emailConfig);
          break;
      }

      // Bağlantıyı test et
      await this.transporter.verify();
      this.logger.log(`Email transporter hazır: provider=${provider}`);

      // Template'leri yükle
      this.loadTemplates();
    } catch (error) {
      this.logger.error('Email transporter oluşturma hatası:', error);
    }
  }

  /**
   * Email gönder
   */
  async send(params: SendEmailParams): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error('Email transporter yapılandırılmamış');
      return false;
    }

    const emailConfig = this.configService.get('email');

    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: params.from || `${emailConfig.from.name} <${emailConfig.from.email}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo || emailConfig.from.replyTo,
        attachments: params.attachments,
        headers: {
          'X-Mailer': 'SuperApp Notification Service',
        },
      };

      // Unsubscribe header ekle
      if (emailConfig.unsubscribe?.enabled) {
        mailOptions.headers['List-Unsubscribe'] = `<${emailConfig.unsubscribe.url}>`;
      }

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.debug(`Email gönderildi: to=${params.to}, messageId=${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Email gönderim hatası: to=${params.to}`, error);
      return false;
    }
  }

  /**
   * Template ile email gönder
   */
  async sendWithTemplate(params: SendTemplateEmailParams): Promise<boolean> {
    const { to, template, data, subject } = params;

    // Template'i al
    const compiledTemplate = this.getTemplate(template);
    
    if (!compiledTemplate) {
      this.logger.error(`Template bulunamadı: ${template}`);
      return false;
    }

    // Template'i render et
    const emailConfig = this.configService.get('email');
    const html = compiledTemplate({
      ...emailConfig.templates?.defaults,
      ...data,
    });

    // Email gönder
    return this.send({
      to,
      subject: subject || this.getDefaultSubject(template),
      html,
    });
  }

  /**
   * Hoş geldin emaili gönder
   */
  async sendWelcomeEmail(
    to: string,
    data: { displayName: string; verificationUrl?: string },
  ): Promise<boolean> {
    const html = getWelcomeTemplate(data);

    return this.send({
      to,
      subject: 'SuperApp\'e Hoş Geldiniz! 🎉',
      html,
    });
  }

  /**
   * Email doğrulama emaili gönder
   */
  async sendVerificationEmail(
    to: string,
    data: { displayName: string; verificationUrl: string; expiresIn: string },
  ): Promise<boolean> {
    const html = getVerifyEmailTemplate(data);

    return this.send({
      to,
      subject: 'Email Adresinizi Doğrulayın',
      html,
    });
  }

  /**
   * Şifre sıfırlama emaili gönder
   */
  async sendResetPasswordEmail(
    to: string,
    data: { displayName: string; resetUrl: string; expiresIn: string },
  ): Promise<boolean> {
    const html = getResetPasswordTemplate(data);

    return this.send({
      to,
      subject: 'Şifre Sıfırlama Talebi',
      html,
    });
  }

  /**
   * Bildirim emaili gönder
   */
  async sendNotificationEmail(
    userId: string,
    params: NotificationEmailParams,
  ): Promise<boolean> {
    // TODO: User service'den email adresini al
    // const userEmail = await this.userService.getEmail(userId);

    this.logger.debug(
      `Bildirim emaili gönderilecek: userId=${userId}, type=${params.type}`,
    );

    // Şimdilik sadece log
    return true;
  }

  /**
   * SMTP transporter oluştur
   */
  private createSMTPTransport(config: any): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.auth?.user
        ? {
            user: config.smtp.auth.user,
            pass: config.smtp.auth.pass,
          }
        : undefined,
    });
  }

  /**
   * SendGrid transporter oluştur
   */
  private createSendGridTransport(config: any): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: config.sendgrid.apiKey,
      },
    });
  }

  /**
   * AWS SES transporter oluştur
   */
  private createSESTransport(config: any): nodemailer.Transporter {
    // AWS SES için nodemailer-ses-transport kullanılabilir
    // Şimdilik SMTP over SES
    return nodemailer.createTransport({
      host: `email-smtp.${config.ses.region}.amazonaws.com`,
      port: 587,
      secure: false,
      auth: {
        user: config.ses.accessKeyId,
        pass: config.ses.secretAccessKey,
      },
    });
  }

  /**
   * Template'leri yükle
   */
  private loadTemplates(): void {
    // Handlebars helpers
    Handlebars.registerHelper('currentYear', () => new Date().getFullYear());
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString('tr-TR');
    });

    this.logger.debug('Email template helpers yüklendi');
  }

  /**
   * Template al
   */
  private getTemplate(name: string): Handlebars.TemplateDelegate | null {
    // Cache'de varsa döndür
    if (this.templates.has(name)) {
      return this.templates.get(name);
    }

    // Template dosyasını oku
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      `${name}.hbs`,
    );

    try {
      if (fs.existsSync(templatePath)) {
        const source = fs.readFileSync(templatePath, 'utf-8');
        const template = Handlebars.compile(source);
        this.templates.set(name, template);
        return template;
      }
    } catch (error) {
      this.logger.error(`Template yükleme hatası: ${name}`, error);
    }

    return null;
  }

  /**
   * Varsayılan email konusu
   */
  private getDefaultSubject(template: string): string {
    const subjects: Record<string, string> = {
      welcome: 'SuperApp\'e Hoş Geldiniz!',
      verifyEmail: 'Email Adresinizi Doğrulayın',
      resetPassword: 'Şifre Sıfırlama Talebi',
      notification: 'Yeni Bildirim',
      digest: 'Haftalık Özetiniz',
    };

    return subjects[template] || 'SuperApp Bildirimi';
  }
}
