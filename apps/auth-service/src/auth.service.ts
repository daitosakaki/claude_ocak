import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Schemas
import { User, UserDocument } from './schemas/user.schema';

// Services
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { OAuthService } from './services/oauth.service';

// DTOs
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthDto } from './dto/oauth.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';

// Types
interface DeviceInfo {
  ip: string;
  userAgent: string;
}

/**
 * Auth Service
 *
 * Kimlik doğrulama iş mantığını yönetir:
 * - Kullanıcı kaydı
 * - Giriş/Çıkış
 * - Token yönetimi
 * - OAuth entegrasyonları
 * - Şifre işlemleri
 * - Email doğrulama
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
    private readonly oauthService: OAuthService,
  ) {}

  /**
   * Yeni kullanıcı kaydı
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, username, displayName } = registerDto;

    // Email kontrolü
    const existingEmail = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      throw new ConflictException({ code: 'EMAIL_TAKEN', message: 'Email already in use' });
    }

    // Username kontrolü
    const existingUsername = await this.userModel.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      throw new ConflictException({ code: 'USERNAME_TAKEN', message: 'Username already in use' });
    }

    // Şifre hash'leme
    const passwordHash = await this.passwordService.hash(password);

    // Kullanıcı oluştur
    const user = new this.userModel({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName,
      passwordHash,
      verification: { email: false, phone: false, identity: false },
      stats: { postsCount: 0, followersCount: 0, followingCount: 0, likesCount: 0 },
      subscription: { plan: 'free' },
      status: 'active',
      modules: { dating: false, listings: false },
    });

    await user.save();
    this.logger.log(`New user registered: ${user.id}`);

    // Email doğrulama maili gönder
    await this.sendVerificationEmail(user);

    // Token'lar oluştur
    const tokens = await this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
    });

    return this.buildAuthResponse(user, tokens);
  }

  /**
   * Kullanıcı girişi
   */
  async login(loginDto: LoginDto, deviceInfo: DeviceInfo): Promise<AuthResponseDto> {
    const { email, password, deviceId, deviceName, platform } = loginDto;

    // Kullanıcıyı bul (şifre dahil)
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash');

    if (!user) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    // Hesap durumu kontrolü
    if (user.status === 'banned') {
      throw new UnauthorizedException({ code: 'ACCOUNT_BANNED', message: 'Account is banned' });
    }
    if (user.status === 'suspended') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_SUSPENDED',
        message: `Account suspended until ${user.suspendedUntil}`,
      });
    }

    // Şifre kontrolü
    const isPasswordValid = await this.passwordService.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    // Token'lar oluştur
    const tokens = await this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
    });

    // Oturum kaydet
    await this.sessionService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      deviceId,
      deviceName,
      platform,
      ip: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
    });

    // Son görülme güncelle
    await this.userModel.updateOne({ _id: user.id }, { lastSeenAt: new Date() });

    this.logger.log(`User logged in: ${user.id}`);

    return this.buildAuthResponse(user, tokens);
  }

  /**
   * Çıkış - Refresh token'ı geçersiz kıl
   */
  async logout(refreshToken: string): Promise<void> {
    await this.sessionService.revokeSession(refreshToken);
    await this.tokenService.blacklistToken(refreshToken);
    this.logger.log('User logged out');
  }

  /**
   * Tüm cihazlardan çıkış
   */
  async logoutAll(userId: string): Promise<number> {
    const count = await this.sessionService.revokeAllSessions(userId);
    this.logger.log(`All sessions revoked for user: ${userId}, count: ${count}`);
    return count;
  }

  /**
   * Token yenileme
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    // Token'ı doğrula
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID', message: 'Invalid refresh token' });
    }

    // Blacklist kontrolü
    const isBlacklisted = await this.tokenService.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID', message: 'Token has been revoked' });
    }

    // Session kontrolü
    const session = await this.sessionService.findByRefreshToken(refreshToken);
    if (!session) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID', message: 'Session not found' });
    }

    // Kullanıcıyı bul
    const user = await this.userModel.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    // Eski token'ı blacklist'e ekle
    await this.tokenService.blacklistToken(refreshToken);

    // Yeni token'lar oluştur
    const tokens = await this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
    });

    // Session güncelle
    await this.sessionService.updateSessionToken(session.id, tokens.refreshToken);

    return this.buildAuthResponse(user, tokens);
  }

  /**
   * Şifre sıfırlama isteği
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Güvenlik: Kullanıcı yoksa bile başarılı gibi davran
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    const resetToken = await this.tokenService.generatePasswordResetToken(user.id);
    
    // TODO: Email servisi ile reset maili gönder
    this.logger.log(`Password reset token generated for user: ${user.id}`);
  }

  /**
   * Şifre sıfırlama
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.tokenService.verifyPasswordResetToken(token);
    if (!userId) {
      throw new BadRequestException({ code: 'TOKEN_INVALID', message: 'Invalid or expired reset token' });
    }

    const passwordHash = await this.passwordService.hash(newPassword);
    await this.userModel.updateOne({ _id: userId }, { passwordHash });

    // Tüm oturumları sonlandır
    await this.sessionService.revokeAllSessions(userId);

    this.logger.log(`Password reset completed for user: ${userId}`);
  }

  /**
   * Email doğrulama
   */
  async verifyEmail(token: string): Promise<void> {
    const userId = await this.tokenService.verifyEmailToken(token);
    if (!userId) {
      throw new BadRequestException({ code: 'TOKEN_INVALID', message: 'Invalid or expired verification token' });
    }

    await this.userModel.updateOne(
      { _id: userId },
      { 'verification.email': true },
    );

    this.logger.log(`Email verified for user: ${userId}`);
  }

  /**
   * Doğrulama emaili tekrar gönder
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if (user.verification.email) {
      throw new BadRequestException({ code: 'ALREADY_VERIFIED', message: 'Email already verified' });
    }

    await this.sendVerificationEmail(user);
  }

  /**
   * Google OAuth girişi
   */
  async googleAuth(oauthDto: OAuthDto, deviceInfo: DeviceInfo): Promise<AuthResponseDto> {
    const googleUser = await this.oauthService.verifyGoogleToken(oauthDto.idToken);
    if (!googleUser) {
      throw new UnauthorizedException({ code: 'OAUTH_FAILED', message: 'Invalid Google token' });
    }

    // Kullanıcıyı bul veya oluştur
    let user = await this.userModel.findOne({
      $or: [
        { 'oauth.google': googleUser.id },
        { email: googleUser.email.toLowerCase() },
      ],
    });

    if (!user) {
      // Yeni kullanıcı oluştur
      user = new this.userModel({
        email: googleUser.email.toLowerCase(),
        username: await this.generateUniqueUsername(googleUser.email),
        displayName: googleUser.name,
        avatar: googleUser.picture,
        oauth: { google: googleUser.id },
        verification: { email: true, phone: false, identity: false },
        stats: { postsCount: 0, followersCount: 0, followingCount: 0, likesCount: 0 },
        subscription: { plan: 'free' },
        status: 'active',
        modules: { dating: false, listings: false },
      });
      await user.save();
      this.logger.log(`New user created via Google OAuth: ${user.id}`);
    } else if (!user.oauth?.google) {
      // Mevcut hesabı Google'a bağla
      await this.userModel.updateOne(
        { _id: user.id },
        { 'oauth.google': googleUser.id },
      );
    }

    // Token'lar oluştur
    const tokens = await this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
    });

    // Oturum kaydet
    await this.sessionService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      deviceId: oauthDto.deviceId,
      deviceName: oauthDto.deviceName,
      platform: oauthDto.platform,
      ip: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
    });

    return this.buildAuthResponse(user, tokens);
  }

  /**
   * Apple OAuth girişi
   */
  async appleAuth(oauthDto: OAuthDto, deviceInfo: DeviceInfo): Promise<AuthResponseDto> {
    const appleUser = await this.oauthService.verifyAppleToken(oauthDto.idToken);
    if (!appleUser) {
      throw new UnauthorizedException({ code: 'OAUTH_FAILED', message: 'Invalid Apple token' });
    }

    // Kullanıcıyı bul veya oluştur
    let user = await this.userModel.findOne({
      $or: [
        { 'oauth.apple': appleUser.id },
        ...(appleUser.email ? [{ email: appleUser.email.toLowerCase() }] : []),
      ],
    });

    if (!user) {
      user = new this.userModel({
        email: appleUser.email?.toLowerCase(),
        username: await this.generateUniqueUsername(appleUser.email || appleUser.id),
        displayName: appleUser.name || 'Apple User',
        oauth: { apple: appleUser.id },
        verification: { email: !!appleUser.email, phone: false, identity: false },
        stats: { postsCount: 0, followersCount: 0, followingCount: 0, likesCount: 0 },
        subscription: { plan: 'free' },
        status: 'active',
        modules: { dating: false, listings: false },
      });
      await user.save();
      this.logger.log(`New user created via Apple OAuth: ${user.id}`);
    } else if (!user.oauth?.apple) {
      await this.userModel.updateOne(
        { _id: user.id },
        { 'oauth.apple': appleUser.id },
      );
    }

    const tokens = await this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
    });

    await this.sessionService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      deviceId: oauthDto.deviceId,
      deviceName: oauthDto.deviceName,
      platform: oauthDto.platform,
      ip: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
    });

    return this.buildAuthResponse(user, tokens);
  }

  /**
   * Kullanıcı doğrulama (token validation için)
   */
  async validateUser(userId: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }
    return this.mapUserToResponse(user);
  }

  /**
   * Email doğrulama maili gönder
   */
  private async sendVerificationEmail(user: UserDocument): Promise<void> {
    const verificationToken = await this.tokenService.generateEmailVerificationToken(user.id);
    // TODO: Email servisi ile doğrulama maili gönder
    this.logger.log(`Verification email token generated for user: ${user.id}`);
  }

  /**
   * Benzersiz username oluştur
   */
  private async generateUniqueUsername(base: string): Promise<string> {
    const cleanBase = base.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = cleanBase.substring(0, 15);
    let suffix = 1;

    while (await this.userModel.findOne({ username })) {
      username = `${cleanBase.substring(0, 12)}${suffix}`;
      suffix++;
    }

    return username;
  }

  /**
   * Auth response oluştur
   */
  private buildAuthResponse(
    user: UserDocument,
    tokens: { accessToken: string; refreshToken: string; expiresIn: number },
  ): AuthResponseDto {
    return {
      success: true,
      data: {
        user: this.mapUserToResponse(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    };
  }

  /**
   * User entity'sini response DTO'ya dönüştür
   */
  private mapUserToResponse(user: UserDocument): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      isVerified: user.isVerified || false,
      createdAt: user.createdAt,
    };
  }
}
