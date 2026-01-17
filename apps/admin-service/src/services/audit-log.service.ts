/**
 * Audit Log Service
 * Admin işlem logları: listeleme, filtreleme, detay
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AdminLog, AdminLogDocument } from '../schemas/admin-log.schema';
import { AdminUser, AdminUserDocument } from '../schemas/admin-user.schema';
import { AdminLogQueryDto, AdminLogListResponseDto, AdminAction } from '../dto/admin-log.dto';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectModel(AdminLog.name) private adminLogModel: Model<AdminLogDocument>,
    @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUserDocument>,
  ) {}

  /**
   * Yeni log oluştur
   */
  async log(
    adminId: string,
    action: AdminAction,
    target: { type: string; id: string },
    details?: {
      before?: any;
      after?: any;
      reason?: string;
    },
    ip?: string,
    userAgent?: string,
  ): Promise<AdminLog> {
    const log = await this.adminLogModel.create({
      adminId: new Types.ObjectId(adminId),
      action,
      target: {
        type: target.type,
        id: new Types.ObjectId(target.id),
      },
      details: details || {},
      ip,
      userAgent,
    });

    this.logger.log(`Audit log: ${action} - Admin: ${adminId} - Target: ${target.type}/${target.id}`);

    return log;
  }

  /**
   * Logları listele (pagination + filtreleme)
   */
  async getLogs(query: AdminLogQueryDto): Promise<AdminLogListResponseDto> {
    const {
      page = 1,
      limit = 50,
      adminId,
      action,
      targetType,
      targetId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Admin filtresi
    if (adminId) {
      if (!Types.ObjectId.isValid(adminId)) {
        throw new BadRequestException('Geçersiz admin ID');
      }
      filter.adminId = new Types.ObjectId(adminId);
    }

    // Action filtresi
    if (action) {
      filter.action = action;
    }

    // Target type filtresi
    if (targetType) {
      filter['target.type'] = targetType;
    }

    // Target ID filtresi
    if (targetId) {
      if (!Types.ObjectId.isValid(targetId)) {
        throw new BadRequestException('Geçersiz target ID');
      }
      filter['target.id'] = new Types.ObjectId(targetId);
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

    const [logs, total] = await Promise.all([
      this.adminLogModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.adminLogModel.countDocuments(filter).exec(),
    ]);

    // Admin bilgilerini enrichment
    const adminIds = [...new Set(logs.map(log => log.adminId.toString()))];
    const admins = await this.adminUserModel
      .find({ _id: { $in: adminIds.map(id => new Types.ObjectId(id)) } })
      .select('name email role')
      .lean()
      .exec();

    const adminMap = new Map(admins.map(admin => [admin._id.toString(), admin]));

    const enrichedLogs = logs.map(log => ({
      ...log,
      admin: adminMap.get(log.adminId.toString()) || null,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: enrichedLogs,
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
   * Log detayı getir
   */
  async getLogById(logId: string): Promise<AdminLog & { admin: any }> {
    if (!Types.ObjectId.isValid(logId)) {
      throw new BadRequestException('Geçersiz log ID');
    }

    const log = await this.adminLogModel.findById(logId).lean().exec();

    if (!log) {
      throw new NotFoundException('Log bulunamadı');
    }

    // Admin bilgisini ekle
    const admin = await this.adminUserModel
      .findById(log.adminId)
      .select('name email role')
      .lean()
      .exec();

    return {
      ...log,
      admin,
    };
  }

  /**
   * Belirli bir target için logları getir
   */
  async getLogsByTarget(targetType: string, targetId: string): Promise<AdminLog[]> {
    if (!Types.ObjectId.isValid(targetId)) {
      throw new BadRequestException('Geçersiz target ID');
    }

    const logs = await this.adminLogModel
      .find({
        'target.type': targetType,
        'target.id': new Types.ObjectId(targetId),
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();

    return logs;
  }

  /**
   * Belirli bir admin'in loglarını getir
   */
  async getLogsByAdmin(adminId: string, limit: number = 50): Promise<AdminLog[]> {
    if (!Types.ObjectId.isValid(adminId)) {
      throw new BadRequestException('Geçersiz admin ID');
    }

    const logs = await this.adminLogModel
      .find({ adminId: new Types.ObjectId(adminId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return logs;
  }

  /**
   * Action bazlı istatistikler
   */
  async getActionStats(startDate?: Date, endDate?: Date): Promise<any[]> {
    const match: any = {};

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const pipeline = [
      ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
    ];

    return this.adminLogModel.aggregate(pipeline).exec();
  }

  /**
   * Admin bazlı istatistikler
   */
  async getAdminStats(startDate?: Date, endDate?: Date): Promise<any[]> {
    const match: any = {};

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const pipeline = [
      ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
      {
        $group: {
          _id: '$adminId',
          totalActions: { $sum: 1 },
          actions: { $push: '$action' },
          lastAction: { $max: '$createdAt' },
        },
      },
      {
        $lookup: {
          from: 'adminusers',
          localField: '_id',
          foreignField: '_id',
          as: 'admin',
        },
      },
      { $unwind: '$admin' },
      {
        $project: {
          adminId: '$_id',
          adminName: '$admin.name',
          adminEmail: '$admin.email',
          adminRole: '$admin.role',
          totalActions: 1,
          lastAction: 1,
        },
      },
      { $sort: { totalActions: -1 } },
    ];

    return this.adminLogModel.aggregate(pipeline).exec();
  }

  /**
   * Günlük aktivite özeti
   */
  async getDailyActivitySummary(days: number = 7): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            action: '$action',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          actions: {
            $push: {
              action: '$_id.action',
              count: '$count',
            },
          },
          totalActions: { $sum: '$count' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    return this.adminLogModel.aggregate(pipeline).exec();
  }

  /**
   * Kritik aksiyonları getir (son 24 saat)
   */
  async getCriticalActions(): Promise<AdminLog[]> {
    const criticalActions = [
      AdminAction.USER_BANNED,
      AdminAction.USER_SUSPENDED,
      AdminAction.POST_DELETED,
      AdminAction.ADMIN_CREATED,
      AdminAction.ADMIN_DELETED,
      AdminAction.SETTINGS_CHANGED,
    ];

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const logs = await this.adminLogModel
      .find({
        action: { $in: criticalActions },
        createdAt: { $gte: oneDayAgo },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    return logs;
  }

  /**
   * Log arama (text search)
   */
  async searchLogs(searchTerm: string, limit: number = 50): Promise<AdminLog[]> {
    // Details içinde arama yap
    const logs = await this.adminLogModel
      .find({
        $or: [
          { 'details.reason': { $regex: searchTerm, $options: 'i' } },
          { 'details.notes': { $regex: searchTerm, $options: 'i' } },
          { action: { $regex: searchTerm, $options: 'i' } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return logs;
  }

  /**
   * Eski logları temizle (maintenance job için)
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.adminLogModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    this.logger.log(`${result.deletedCount} eski log silindi (${retentionDays} günden eski)`);

    return result.deletedCount;
  }
}
