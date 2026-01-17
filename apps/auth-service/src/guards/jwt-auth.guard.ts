import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

/**
 * Public decorator için key
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * JWT Auth Guard
 *
 * Access token doğrulama guard'ı
 * Tüm korumalı endpoint'lerde kullanılır
 *
 * Kullanım:
 * @UseGuards(JwtAuthGuard)
 * @Get('protected')
 * async protectedRoute() { ... }
 *
 * Public endpoint için:
 * @Public()
 * @Get('public')
 * async publicRoute() { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Guard'ı aktifleştirmeden önce public kontrolü yap
   */
  canActivate(context: ExecutionContext) {
    // Public decorator kontrolü
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * JWT doğrulama başarısız olduğunda
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // Token süresi dolmuş
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
        });
      }

      // Token geçersiz
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException({
          code: 'TOKEN_INVALID',
          message: 'Invalid access token',
        });
      }

      // Genel hata
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    return user;
  }
}

/**
 * JWT Refresh Guard
 *
 * Refresh token doğrulama guard'ı
 * Token yenileme endpoint'inde kullanılır
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          code: 'TOKEN_EXPIRED',
          message: 'Refresh token has expired',
        });
      }

      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: 'Invalid refresh token',
      });
    }

    return user;
  }
}
