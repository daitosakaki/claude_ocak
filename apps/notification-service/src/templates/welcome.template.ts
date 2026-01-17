/**
 * Hoş Geldin Email Template
 * Yeni kullanıcı kaydında gönderilir
 */

export interface WelcomeTemplateData {
  displayName: string;
  verificationUrl?: string;
}

export function getWelcomeTemplate(data: WelcomeTemplateData): string {
  const { displayName, verificationUrl } = data;

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SuperApp'e Hoş Geldiniz!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header .emoji {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      color: #333;
      margin-top: 0;
    }
    .features {
      margin: 20px 0;
    }
    .feature {
      display: flex;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    .feature-icon {
      font-size: 24px;
      margin-right: 15px;
    }
    .feature-text h4 {
      margin: 0 0 5px 0;
      color: #333;
    }
    .feature-text p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 25px;
      font-weight: bold;
      margin: 20px 0;
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .text-center {
      text-align: center;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .social-links {
      margin: 15px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      font-size: 24px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🎉</div>
      <h1>SuperApp'e Hoş Geldin!</h1>
    </div>
    
    <div class="content">
      <h2>Merhaba ${displayName}!</h2>
      
      <p>SuperApp ailesine katıldığın için çok mutluyuz! Artık Türkiye'nin en kapsamlı sosyal platformunun bir parçasısın.</p>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">📱</div>
          <div class="feature-text">
            <h4>Sosyal Ağ</h4>
            <p>Düşüncelerini paylaş, topluluklar kur, trendleri takip et.</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-icon">🛒</div>
          <div class="feature-text">
            <h4>İlan Ver</h4>
            <p>İkinci el alışveriş yap, ürünlerini sat, fırsatları yakala.</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-icon">💕</div>
          <div class="feature-text">
            <h4>Tanış</h4>
            <p>Yeni insanlarla tanış, anlamlı bağlantılar kur.</p>
          </div>
        </div>
      </div>
      
      ${
        verificationUrl
          ? `
      <div class="text-center">
        <p>Başlamadan önce, lütfen email adresini doğrula:</p>
        <a href="${verificationUrl}" class="cta-button">Email Adresimi Doğrula</a>
        <p style="font-size: 12px; color: #666;">
          Bu link 24 saat geçerlidir.
        </p>
      </div>
      `
          : `
      <div class="text-center">
        <a href="https://superapp.com/app" class="cta-button">Uygulamayı Aç</a>
      </div>
      `
      }
    </div>
    
    <div class="footer">
      <div class="social-links">
        <a href="https://twitter.com/superapp">🐦</a>
        <a href="https://instagram.com/superapp">📸</a>
        <a href="https://facebook.com/superapp">👤</a>
      </div>
      
      <p>
        Sorularınız mı var? <a href="mailto:support@superapp.com">support@superapp.com</a> adresinden bize ulaşın.
      </p>
      
      <p>
        © ${new Date().getFullYear()} SuperApp. Tüm hakları saklıdır.<br>
        <a href="https://superapp.com/privacy">Gizlilik Politikası</a> | 
        <a href="https://superapp.com/terms">Kullanım Şartları</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
