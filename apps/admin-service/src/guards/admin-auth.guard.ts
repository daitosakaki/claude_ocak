/**
 * Admin Auth Guard
 * JWT tabanlı admin kimlik doğrulama
 */

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AdminAuthGuard extends AuthGuard('admin-jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Public route kontrolü
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token süresi dolmuş');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Geçersiz token');
      }
      throw new UnauthorizedException('Yetkilendirme başarısız');
    }

    // Admin status kontrolü
    if (user.status !== 'active') {
      throw new UnauthorizedException('Hesap aktif değil');
    }

    return user;
  }
}
