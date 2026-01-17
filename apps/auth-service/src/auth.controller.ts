import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Req,
  Headers,
  Ip,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';

// DTOs
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { OAuthDto } from './dto/oauth.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-auth.guard';

// Types
import { Request } from 'express';

/**
 * Auth Controller
 *
 * Kimlik doğrulama endpoint'leri:
 * - POST /auth/register - Yeni kullanıcı kaydı
 * - POST /auth/login - Giriş
 * - POST /auth/logout - Çıkış
 * - POST /auth/logout-all - Tüm cihazlardan çıkış
 * - POST /auth/refresh - Token yenileme
 * - POST /auth/forgot-password - Şifre sıfırlama isteği
 * - POST /auth/reset-password - Şifre sıfırlama
 * - POST /auth/verify-email - Email doğrulama
 * - POST /auth/resend-verification - Doğrulama emaili tekrar gönder
 * - POST /auth/oauth/google - Google ile giriş
 * - POST /auth/oauth/apple - Apple ile giriş
 */
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Yeni kullanıcı kaydı
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Kullanıcı girişi
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto, { ip, userAgent });
  }

  /**
   * Çıkış - Mevcut oturumu sonlandırır
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Body() body: RefreshTokenDto): Promise<{ success: boolean }> {
    await this.authService.logout(body.refreshToken);
    return { success: true };
  }

  /**
   * Tüm cihazlardan çıkış
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Req() req: Request): Promise<{ success: boolean; sessionsRevoked: number }> {
    const userId = req.user['userId'];
    const count = await this.authService.logoutAll(userId);
    return { success: true, sessionsRevoked: count };
  }

  /**
   * Access token yenileme
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  /**
   * Şifre sıfırlama isteği
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return { success: true, message: 'Password reset email sent' };
  }

  /**
   * Şifre sıfırlama
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
    return { success: true, message: 'Password updated successfully' };
  }

  /**
   * Email doğrulama
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<{ success: boolean; message: string }> {
    await this.authService.verifyEmail(verifyEmailDto.token);
    return { success: true, message: 'Email verified successfully' };
  }

  /**
   * Doğrulama emaili tekrar gönder
   */
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async resendVerification(@Req() req: Request): Promise<{ success: boolean; message: string }> {
    const userId = req.user['userId'];
    await this.authService.resendVerificationEmail(userId);
    return { success: true, message: 'Verification email sent' };
  }

  /**
   * Google OAuth girişi
   */
  @Post('oauth/google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(
    @Body() oauthDto: OAuthDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.googleAuth(oauthDto, { ip, userAgent });
  }

  /**
   * Apple OAuth girişi
   */
  @Post('oauth/apple')
  @HttpCode(HttpStatus.OK)
  async appleAuth(
    @Body() oauthDto: OAuthDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.appleAuth(oauthDto, { ip, userAgent });
  }

  /**
   * Mevcut kullanıcıyı doğrula (token validation)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: Request) {
    return this.authService.validateUser(req.user['userId']);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  health(): { status: string; service: string } {
    return { status: 'ok', service: 'auth-service' };
  }
}
