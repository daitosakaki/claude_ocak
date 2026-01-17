import { registerAs } from '@nestjs/config';

/**
 * Email Konfigürasyonu
 * 
 * SendGrid veya AWS SES ile email gönderimi için ayarlar
 */
export default registerAs('email', () => ({
  // Email sağlayıcısı: 'sendgrid' | 'ses' | 'smtp'
  provider: process.env.EMAIL_PROVIDER || 'smtp',

  // SMTP ayarları (development için)
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT, 10) || 1025,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },

  // SendGrid ayarları
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    // Template ID'leri
    templates: {
      welcome: process.env.SENDGRID_TEMPLATE_WELCOME,
      verifyEmail: process.env.SENDGRID_TEMPLATE_VERIFY_EMAIL,
      resetPassword: process.env.SENDGRID_TEMPLATE_RESET_PASSWORD,
      notification: process.env.SENDGRID_TEMPLATE_NOTIFICATION,
      digest: process.env.SENDGRID_TEMPLATE_DIGEST,
    },
  },

  // AWS SES ayarları
  ses: {
    region: process.env.AWS_SES_REGION || 'eu-west-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  // Gönderici bilgileri
  from: {
    name: process.env.EMAIL_FROM_NAME || 'SuperApp',
    email: process.env.EMAIL_FROM_ADDRESS || 'noreply@superapp.com',
    replyTo: process.env.EMAIL_REPLY_TO || 'support@superapp.com',
  },

  // Email kategorileri ve ayarları
  categories: {
    transactional: {
      // Zorunlu emailler (şifre sıfırlama, doğrulama)
      priority: 'high',
      trackOpens: false,
      trackClicks: false,
    },
    notification: {
      // Bildirim emailleri
      priority: 'normal',
      trackOpens: true,
      trackClicks: true,
    },
    marketing: {
      // Pazarlama emailleri (ileride)
      priority: 'low',
      trackOpens: true,
      trackClicks: true,
    },
  },

  // Rate limiting
  rateLimit: {
    perUser: {
      maxPerHour: 10,
      maxPerDay: 50,
    },
    global: {
      maxPerSecond: 50,
      maxPerMinute: 1000,
    },
  },

  // Retry ayarları
  retry: {
    maxAttempts: 3,
    initialDelay: 5000, // 5 saniye
    maxDelay: 60000, // 1 dakika
  },

  // Template ayarları
  templates: {
    // Handlebars template dizini
    dir: process.env.EMAIL_TEMPLATES_DIR || 'src/templates',
    // Varsayılan değişkenler
    defaults: {
      appName: 'SuperApp',
      appUrl: process.env.APP_URL || 'https://superapp.com',
      supportEmail: 'support@superapp.com',
      unsubscribeUrl: '{{unsubscribeUrl}}',
      currentYear: new Date().getFullYear(),
    },
  },

  // Unsubscribe ayarları
  unsubscribe: {
    enabled: true,
    // List-Unsubscribe header için URL
    url: process.env.UNSUBSCRIBE_URL || 'https://superapp.com/unsubscribe',
  },

  // Digest email ayarları
  digest: {
    // Günlük digest saati (UTC)
    dailyHour: 9,
    // Haftalık digest günü (0 = Pazar, 1 = Pazartesi)
    weeklyDay: 1,
    // Minimum bildirim sayısı (bu kadar birikmediyse gönderme)
    minNotifications: 3,
  },
}));
