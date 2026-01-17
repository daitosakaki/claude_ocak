import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { JwtPayload } from '../config/jwt.config';

/**
 * JWT Strategy
 *
 * Access token doğrulama stratejisi
 *
 * Flow:
 * 1. Authorization header'dan Bearer token alınır
 * 2. Token secret ile doğrulanır
 * 3. Payload'dan userId alınır
 * 4. Kullanıcı veritabanından kontrol edilir
 * 5. Request'e user objesi eklenir
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super({
      // Token'ı Authorization: Bearer xxx header'ından al
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Token süresi dolmuşsa hata fırlat
      ignoreExpiration: false,

      // Secret key
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),

      // İssuer kontrolü (opsiyonel)
      issuer: configService.get<string>('JWT_ISSUER', 'superapp'),

      // Audience kontrolü (opsiyonel)
      audience: configService.get<string>('JWT_AUDIENCE', 'superapp-users'),
    });
  }

  /**
   * Token doğrulandıktan sonra çağrılır
   * Dönen değer request.user'a atanır
   */
  async validate(payload: JwtPayload) {
    // Payload kontrolü
    if (!payload.userId) {
      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: 'Invalid token payload',
      });
    }

    // Kullanıcı kontrolü
    const user = await this.userModel.findById(payload.userId).lean();

    if (!user) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    // Hesap durumu kontrolü
    if (user.status === 'banned') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_BANNED',
        message: 'Account has been banned',
      });
    }

    if (user.status === 'suspended') {
      const suspendedUntil = user.suspendedUntil;
      if (suspendedUntil && new Date() < new Date(suspendedUntil)) {
        throw new UnauthorizedException({
          code: 'ACCOUNT_SUSPENDED',
          message: `Account suspended until ${suspendedUntil}`,
        });
      }
    }

    if (user.status === 'deleted') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DELETED',
        message: 'Account has been deleted',
      });
    }

    // Request.user'a atanacak değer
    return {
      userId: payload.userId,
      email: payload.email,
    };
  }
}
