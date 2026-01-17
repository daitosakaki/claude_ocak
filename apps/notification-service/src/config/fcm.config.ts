import { registerAs } from '@nestjs/config';

/**
 * Firebase Cloud Messaging (FCM) Konfigürasyonu
 * 
 * Push notification gönderimi için Firebase Admin SDK ayarları
 */
export default registerAs('fcm', () => ({
  // Firebase proje ayarları
  projectId: process.env.FIREBASE_PROJECT_ID,
  
  // Service account (JSON formatında veya dosya yolu)
  serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined,
  serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,

  // Varsayılan bildirim ayarları
  defaults: {
    // Android ayarları
    android: {
      priority: 'high' as const,
      ttl: 86400000, // 24 saat (ms)
      notification: {
        sound: 'default',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        channelId: 'default',
      },
    },
    
    // iOS (APNs) ayarları
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          contentAvailable: true,
          mutableContent: true,
        },
      },
      headers: {
        'apns-priority': '10',
        'apns-push-type': 'alert',
      },
    },

    // Web push ayarları
    webpush: {
      headers: {
        Urgency: 'high',
      },
      notification: {
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
      },
    },
  },

  // Bildirim kanalları (Android Oreo+)
  channels: {
    default: {
      id: 'default',
      name: 'Genel Bildirimler',
      description: 'Genel uygulama bildirimleri',
      importance: 'high',
    },
    messages: {
      id: 'messages',
      name: 'Mesajlar',
      description: 'Yeni mesaj bildirimleri',
      importance: 'high',
    },
    social: {
      id: 'social',
      name: 'Sosyal',
      description: 'Beğeni, yorum, takip bildirimleri',
      importance: 'default',
    },
    dating: {
      id: 'dating',
      name: 'Flört',
      description: 'Eşleşme bildirimleri',
      importance: 'high',
    },
    listings: {
      id: 'listings',
      name: 'İlanlar',
      description: 'İlan bildirimleri',
      importance: 'default',
    },
  },

  // Retry ayarları
  retry: {
    maxAttempts: 3,
    initialDelay: 1000, // 1 saniye
    maxDelay: 30000, // 30 saniye
    multiplier: 2,
  },

  // Batch gönderim ayarları
  batch: {
    maxSize: 500, // FCM limiti
    delayBetweenBatches: 100, // ms
  },

  // Topic'ler
  topics: {
    announcements: 'announcements', // Genel duyurular
    maintenance: 'maintenance', // Bakım bildirimleri
  },
}));
