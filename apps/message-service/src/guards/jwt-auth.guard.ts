/**
 * JWT Auth Guard
 * HTTP endpoint'leri için JWT doğrulama
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token bulunamadı');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      // Request'e user bilgisini ekle
      request['user'] = {
        userId: payload.sub || payload.userId,
        email: payload.email,
        username: payload.username,
      };

      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token süresi dolmuş');
      }
      throw new UnauthorizedException('Geçersiz token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
