/**
 * Şifre Sıfırlama Email Template
 * Şifre sıfırlama talebi yapıldığında gönderilir
 */

export interface ResetPasswordTemplateData {
  displayName: string;
  resetUrl: string;
  expiresIn: string;
}

export function getResetPasswordTemplate(data: ResetPasswordTemplateData): string {
  const { displayName, resetUrl, expiresIn } = data;

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Şifre Sıfırlama</title>
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
      background: #f8d7da;
      color: #721c24;
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
    .warning-box {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .warning-box p {
      margin: 0;
      color: #856404;
    }
    .cta-button {
      display: inline-block;
      background: #dc3545;
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 25px;
      font-weight: bold;
      margin: 20px 0;
    }
    .cta-button:hover {
      background: #c82333;
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
    .security-tips {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .security-tips h4 {
      margin-top: 0;
      color: #333;
    }
    .security-tips ul {
      margin: 0;
      padding-left: 20px;
      color: #666;
    }
    .security-tips li {
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">🔐</div>
      <h1>Şifre Sıfırlama Talebi</h1>
    </div>
    
    <div class="content">
      <h2>Merhaba ${displayName},</h2>
      
      <p>SuperApp hesabınız için bir şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
      
      <div class="text-center">
        <a href="${resetUrl}" class="cta-button">Şifremi Sıfırla</a>
      </div>
      
      <p>Buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayın:</p>
      
      <div class="link-box">
        ${resetUrl}
      </div>
      
      <div class="warning-box">
        <p>⚠️ Bu link <strong>${expiresIn}</strong> içinde geçerliliğini yitirecektir.</p>
      </div>
      
      <p>Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz. Hesabınız güvende.</p>
      
      <div class="security-tips">
        <h4>🛡️ Güvenlik İpuçları</h4>
        <ul>
          <li>Güçlü ve benzersiz bir şifre seçin (en az 8 karakter, büyük-küçük harf, rakam)</li>
          <li>Şifrenizi kimseyle paylaşmayın</li>
          <li>İki faktörlü doğrulamayı aktifleştirin</li>
          <li>SuperApp sizden asla şifrenizi email ile istemez</li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p>
        Bu emaili beklemiyordunuz mu? Birisi yanlışlıkla email adresinizi girmiş olabilir.
        Eğer bu talebi siz yapmadıysanız, herhangi bir işlem yapmanıza gerek yok.
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
