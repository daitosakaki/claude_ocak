/**
 * Email Doğrulama Template
 * Kayıt sonrası email doğrulaması için gönderilir
 */

export interface VerifyEmailTemplateData {
  displayName: string;
  verificationUrl: string;
  expiresIn: string;
}

export function getVerifyEmailTemplate(data: VerifyEmailTemplateData): string {
  const { displayName, verificationUrl, expiresIn } = data;

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Doğrulama</title>
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
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      color: #333;
      margin-top: 0;
    }
    .info-box {
      background: #d4edda;
      border: 1px solid #28a745;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .info-box p {
      margin: 0;
      color: #155724;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
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
    .link-box {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      margin: 15px 0;
      word-break: break-all;
      font-size: 12px;
      color: #666;
    }
    .benefits {
      margin: 25px 0;
    }
    .benefit-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .benefit-icon {
      font-size: 20px;
      margin-right: 12px;
    }
    .benefit-text {
      color: #555;
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
    .expires {
      font-size: 14px;
      color: #666;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">✉️</div>
      <h1>Email Adresini Doğrula</h1>
    </div>
    
    <div class="content">
      <h2>Merhaba ${displayName}!</h2>
      
      <p>SuperApp'e kaydolduğun için teşekkürler! Hesabını aktifleştirmek için email adresini doğrulaman gerekiyor.</p>
      
      <div class="text-center">
        <a href="${verificationUrl}" class="cta-button">Email Adresimi Doğrula</a>
        <p class="expires">⏰ Bu link ${expiresIn} içinde geçerliliğini yitirecek</p>
      </div>
      
      <p>Buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayın:</p>
      
      <div class="link-box">
        ${verificationUrl}
      </div>
      
      <div class="info-box">
        <p>✅ Email doğrulandıktan sonra tüm özelliklere erişebileceksiniz!</p>
      </div>
      
      <div class="benefits">
        <h3>Email doğrulama ile:</h3>
        
        <div class="benefit-item">
          <span class="benefit-icon">💬</span>
          <span class="benefit-text">Diğer kullanıcılarla mesajlaşabilirsiniz</span>
        </div>
        
        <div class="benefit-item">
          <span class="benefit-icon">📝</span>
          <span class="benefit-text">Gönderi paylaşabilirsiniz</span>
        </div>
        
        <div class="benefit-item">
          <span class="benefit-icon">🔔</span>
          <span class="benefit-text">Bildirim alabilirsiniz</span>
        </div>
        
        <div class="benefit-item">
          <span class="benefit-icon">🔐</span>
          <span class="benefit-text">Hesabınızı daha güvenli hale getirirsiniz</span>
        </div>
      </div>
      
      <p>Bu emaili siz talep etmediyseniz, görmezden gelebilirsiniz. Hesabınız otomatik olarak silinecektir.</p>
    </div>
    
    <div class="footer">
      <p>
        Yardıma mı ihtiyacınız var? <a href="mailto:support@superapp.com">support@superapp.com</a>
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
