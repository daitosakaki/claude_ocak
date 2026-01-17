/**
 * User Management Service
 * Kullanıcı yönetimi işlemleri: listeleme, ban, suspend, verify
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { AdminLog, AdminLogDocument } from '../schemas/admin-log.schema';
import { UserQueryDto, BanUserDto, SuspendUserDto, UserListResponseDto } from '../dto/user-action.dto';
import { AdminAction } from '../dto/admin-log.dto';

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AdminLog.name) private adminLogModel: Model<AdminLogDocument>,
  ) {}

  /**
   * Kullanıcıları listele (pagination + filtreleme)
   */
  async getUsers(query: UserQueryDto): Promise<UserListResponseDto> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      isVerified,
      subscriptionPlan,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Arama filtresi
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filtresi
    if (status) {
      filter.status = status;
    }

    // Doğrulama filtresi
    if (isVerified !== undefined) {
      filter.isVerified = isVerified;
    }

    // Abonelik filtresi
    if (subscriptionPlan) {
      filter['subscription.plan'] = subscriptionPlan;
    }

    // Tarih aralığı filtresi
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Sıralama
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-passwordHash -oauth')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Kullanıcı detayı getir
   */
  async getUserById(userId: string): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Geçersiz kullanıcı ID');
    }

    const user = await this.userModel
      .findById(userId)
      .select('-passwordHash')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return user;
  }

  /**
   * Kullanıcıyı banla (kalıcı)
   */
  async banUser(
    userId: string,
    dto: BanUserDto,
    adminId: string,
    ip: string,
  ): Promise<User> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.status === 'banned') {
      throw new BadRequestException('Kullanıcı zaten banlı');
    }

    const previousStatus = user.status;

    user.status = 'banned';
    user.banReason = dto.reason;
    await user.save();

    // Audit log
    await this.createLog(adminId, AdminAction.USER_BANNED, 'user', userId, {
      before: { status: previousStatus },
      after: { status: 'banned' },
      reason: dto.reason,
    }, ip);

    this.logger.log(`Kullanıcı banlandı: ${userId} - Admin: ${adminId}`);

    return this.getUserById(userId);
  }

  /**
   * Kullanıcının banını kaldır
   */
  async unbanUser(userId: string, adminId: string, ip: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.status !== 'banned') {
      throw new BadRequestException('Kullanıcı banlı değil');
    }

    user.status = 'active';
    user.banReason = undefined;
    await user.save();

    // Audit log
    await this.createLog(adminId, AdminAction.USER_UNBANNED, 'user', userId, {
      before: { status: 'banned' },
      after: { status: 'active' },
    }, ip);

    this.logger.log(`Kullanıcı ban kaldırıldı: ${userId} - Admin: ${adminId}`);

    return this.getUserById(userId);
  }

  /**
   * Kullanıcıyı askıya al (geçici)
   */
  async suspendUser(
    userId: string,
    dto: SuspendUserDto,
    adminId: string,
    ip: string,
  ): Promise<User> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.status === 'banned') {
      throw new BadRequestException('Banlı kullanıcı askıya alınamaz');
    }

    if (user.status === 'suspended') {
      throw new BadRequestException('Kullanıcı zaten askıda');
    }

    const previousStatus = user.status;
    const suspendedUntil = new Date(dto.until);

    user.status = 'suspended';
    user.suspendedUntil = suspendedUntil;
    await user.save();

    // Audit log
    await this.createLog(adminId, AdminAction.USER_SUSPENDED, 'user', userId, {
      before: { status: previousStatus },
      after: { status: 'suspended', suspendedUntil },
      reason: dto.reason,
    }, ip);

    this.logger.log(`Kullanıcı askıya alındı: ${userId} - Admin: ${adminId}`);

    return this.getUserById(userId);
  }

  /**
   * Kullanıcının askıya almasını kaldır
   */
  async unsuspendUser(userId: string, adminId: string, ip: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.status !== 'suspended') {
      throw new BadRequestException('Kullanıcı askıda değil');
    }

    user.status = 'active';
    user.suspendedUntil = undefined;
    await user.save();

    // Audit log
    await this.createLog(adminId, AdminAction.USER_UNSUSPENDED, 'user', userId, {
      before: { status: 'suspended' },
      after: { status: 'active' },
    }, ip);

    this.logger.log(`Kullanıcı askı kaldırıldı: ${userId} - Admin: ${adminId}`);

    return this.getUserById(userId);
  }

  /**
   * Kullanıcıyı doğrula (mavi tik)
   */
  async verifyUser(userId: string, adminId: string, ip: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.isVerified) {
      throw new BadRequestException('Kullanıcı zaten doğrulanmış');
    }

    user.isVerified = true;
    user.verification = {
      ...user.verification,
      identity: true,
    };
    await user.save();

    // Audit log
    await this.createLog(adminId, AdminAction.USER_VERIFIED, 'user', userId, {
      before: { isVerified: false },
      after: { isVerified: true },
    }, ip);

    this.logger.log(`Kullanıcı doğrulandı: ${userId} - Admin: ${adminId}`);

    return this.getUserById(userId);
  }

  /**
   * Kullanıcının doğrulamasını kaldır
   */
  async unverifyUser(userId: string, adminId: string, ip: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (!user.isVerified) {
      throw new BadRequestException('Kullanıcı zaten doğrulanmamış');
    }

    user.isVerified = false;
    user.verification = {
      ...user.verification,
      identity: false,
    };
    await user.save();

    // Audit log
    await this.createLog(adminId, AdminAction.USER_UNVERIFIED, 'user', userId, {
      before: { isVerified: true },
      after: { isVerified: false },
    }, ip);

    this.logger.log(`Kullanıcı doğrulama kaldırıldı: ${userId} - Admin: ${adminId}`);

    return this.getUserById(userId);
  }

  /**
   * Kullanıcı bilgilerini güncelle
   */
  async updateUser(
    userId: string,
    updates: Partial<User>,
    adminId: string,
    ip: string,
  ): Promise<User> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Sadece belirli alanların güncellenmesine izin ver
    const allowedFields = ['displayName', 'bio', 'isPrivate'];
    const sanitizedUpdates: any = {};
    const before: any = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        before[field] = user[field];
        sanitizedUpdates[field] = updates[field];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      throw new BadRequestException('Güncellenecek alan bulunamadı');
    }

    Object.assign(user, sanitizedUpdates);
    await user.save();

    // Audit log
    await this.createLog(adminId, AdminAction.USER_UPDATED, 'user', userId, {
      before,
      after: sanitizedUpdates,
    }, ip);

    this.logger.log(`Kullanıcı güncellendi: ${userId} - Admin: ${adminId}`);

    return this.getUserById(userId);
  }

  /**
   * Audit log oluştur
   */
  private async createLog(
    adminId: string,
    action: AdminAction,
    targetType: string,
    targetId: string,
    details: any,
    ip: string,
  ): Promise<void> {
    await this.adminLogModel.create({
      adminId: new Types.ObjectId(adminId),
      action,
      target: {
        type: targetType,
        id: new Types.ObjectId(targetId),
      },
      details,
      ip,
    });
  }
}
