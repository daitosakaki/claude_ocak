import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { AdminUser, AdminUserDocument } from './schemas/admin-user.schema';
import { AuditLogService } from './services/audit-log.service';
import { AdminLoginDto, ChangePasswordDto } from './dto/admin-login.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(AdminUser.name)
    private readonly adminUserModel: Model<AdminUserDocument>,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Admin girişi
   */
  async login(loginDto: AdminLoginDto): Promise<any> {
    const { email, password } = loginDto;

    // Admin kullanıcısını bul
    const admin = await this.adminUserModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash');

    if (!admin) {
      this.logger.warn(`Başarısız giriş denemesi: ${email}`);
      throw new UnauthorizedException('Geçersiz email veya şifre');
    }

    // Hesap durumu kontrolü
    if (admin.status !== 'active') {
      this.logger.warn(`Askıya alınmış hesap giriş denemesi: ${email}`);
      throw new UnauthorizedException('Hesabınız askıya alınmış');
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Yanlış şifre denemesi: ${email}`);
      throw new UnauthorizedException('Geçersiz email veya şifre');
    }

    // JWT token oluştur
    const payload = {
      sub: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    // Son giriş bilgisini güncelle
    await this.adminUserModel.findByIdAndUpdate(admin._id, {
      lastLoginAt: new Date(),
      lastLoginIp: loginDto.ip || null,
    });

    // Audit log
    await this.auditLogService.log({
      adminId: admin._id.toString(),
      action: 'admin_login',
      target: { type: 'admin', id: admin._id.toString() },
      details: { ip: loginDto.ip },
    });

    this.logger.log(`Admin girişi başarılı: ${email}`);

    return {
      success: true,
      data: {
        admin: {
          id: admin._id.toString(),
          email: admin.email,
          name: admin.name,
          avatar: admin.avatar,
          role: admin.role,
          permissions: admin.permissions,
        },
        accessToken,
        expiresIn: 28800, // 8 saat
      },
    };
  }

  /**
   * Admin çıkışı
   */
  async logout(adminId: string): Promise<void> {
    await this.auditLogService.log({
      adminId,
      action: 'admin_logout',
      target: { type: 'admin', id: adminId },
      details: {},
    });

    this.logger.log(`Admin çıkışı: ${adminId}`);
  }

  /**
   * Şifre değiştir
   */
  async changePassword(
    adminId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const admin = await this.adminUserModel
      .findById(adminId)
      .select('+passwordHash');

    if (!admin) {
      throw new NotFoundException('Admin bulunamadı');
    }

    // Mevcut şifre kontrolü
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      admin.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mevcut şifre hatalı');
    }

    // Yeni şifreyi hashle
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 12);

    // Şifreyi güncelle
    await this.adminUserModel.findByIdAndUpdate(adminId, {
      passwordHash: newPasswordHash,
    });

    // Audit log
    await this.auditLogService.log({
      adminId,
      action: 'password_changed',
      target: { type: 'admin', id: adminId },
      details: {},
    });

    this.logger.log(`Admin şifre değişikliği: ${adminId}`);
  }

  /**
   * Admin bilgisi getir
   */
  async getAdminById(adminId: string): Promise<any> {
    const admin = await this.adminUserModel.findById(adminId);

    if (!admin) {
      throw new NotFoundException('Admin bulunamadı');
    }

    return {
      success: true,
      data: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        avatar: admin.avatar,
        role: admin.role,
        permissions: admin.permissions,
        status: admin.status,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
      },
    };
  }

  /**
   * Admin doğrulama (JWT strategy için)
   */
  async validateAdmin(adminId: string): Promise<AdminUserDocument | null> {
    const admin = await this.adminUserModel.findById(adminId);

    if (!admin || admin.status !== 'active') {
      return null;
    }

    return admin;
  }

  /**
   * Yeni admin oluştur (sadece super_admin)
   */
  async createAdmin(
    createDto: {
      email: string;
      password: string;
      name: string;
      role: string;
      permissions: string[];
    },
    creatorId: string,
  ): Promise<any> {
    // Email kontrolü
    const existingAdmin = await this.adminUserModel.findOne({
      email: createDto.email.toLowerCase(),
    });

    if (existingAdmin) {
      throw new BadRequestException('Bu email zaten kullanılıyor');
    }

    // Şifreyi hashle
    const passwordHash = await bcrypt.hash(createDto.password, 12);

    // Admin oluştur
    const admin = new this.adminUserModel({
      email: createDto.email.toLowerCase(),
      passwordHash,
      name: createDto.name,
      role: createDto.role,
      permissions: createDto.permissions,
      status: 'active',
    });

    await admin.save();

    // Audit log
    await this.auditLogService.log({
      adminId: creatorId,
      action: 'admin_created',
      target: { type: 'admin', id: admin._id.toString() },
      details: {
        email: admin.email,
        role: admin.role,
      },
    });

    this.logger.log(`Yeni admin oluşturuldu: ${admin.email}`);

    return {
      success: true,
      data: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
      },
    };
  }
}
