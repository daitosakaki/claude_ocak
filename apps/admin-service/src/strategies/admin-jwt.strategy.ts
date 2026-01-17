/**
 * Admin JWT Strategy
 * Passport JWT kimlik doğrulama stratejisi
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { AdminUser, AdminUserDocument } from '../schemas/admin-user.schema';

// JWT Payload interface
export interface JwtPayload {
  sub: string;       // Admin ID
  email: string;     // Admin email
  role: string;      // Admin rolü
  type: 'admin';     // Token tipi (admin token olduğunu belirtir)
  iat?: number;      // Issued at
  exp?: number;      // Expiration
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private configService: ConfigService,
    @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  /**
   * JWT doğrulandıktan sonra çalışır
   * Payload'dan admin bilgisini döner
   */
  async validate(payload: JwtPayload): Promise<AdminUser> {
    // Token tipini kontrol et
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Geçersiz token tipi');
    }

    // Admin'i veritabanından getir
    const admin = await this.adminUserModel
      .findById(payload.sub)
      .select('-passwordHash')
      .lean()
      .exec();

    if (!admin) {
      throw new UnauthorizedException('Admin bulunamadı');
    }

    // Admin status kontrolü
    if (admin.status !== 'active') {
      throw new UnauthorizedException('Hesap aktif değil');
    }

    return admin;
  }
}
