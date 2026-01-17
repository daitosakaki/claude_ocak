/**
 * Moderation Service
 * İçerik moderasyonu: post/comment silme, gizleme, rapor yönetimi
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../schemas/post.schema';
import { Comment, CommentDocument } from '../schemas/comment.schema';
import { Report, ReportDocument } from '../schemas/report.schema';
import { AdminLog, AdminLogDocument } from '../schemas/admin-log.schema';
import { ReportQueryDto, ReportActionDto, ReportListResponseDto } from '../dto/report-action.dto';
import { AdminAction } from '../dto/admin-log.dto';

// Moderasyon kuyruğu için interface
interface ModerationQueueItem {
  id: string;
  type: 'post' | 'comment';
  content: any;
  reportCount: number;
  latestReport?: Report;
  createdAt: Date;
}

interface ModerationQueueResponse {
  success: boolean;
  data: ModerationQueueItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel(AdminLog.name) private adminLogModel: Model<AdminLogDocument>,
  ) {}

  /**
   * Moderasyon kuyruğunu getir (raporlanan içerikler)
   */
  async getModerationQueue(
    page: number = 1,
    limit: number = 20,
    type?: 'post' | 'comment',
  ): Promise<ModerationQueueResponse> {
    const skip = (page - 1) * limit;

    // Bekleyen raporları grupla
    const matchStage: any = { status: 'pending' };
    if (type) {
      matchStage['target.type'] = type;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: { type: '$target.type', id: '$target.id' },
          reportCount: { $sum: 1 },
          latestReport: { $last: '$$ROOT' },
        },
      },
      { $sort: { reportCount: -1, 'latestReport.createdAt': -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const [results, totalResults] = await Promise.all([
      this.reportModel.aggregate(pipeline).exec(),
      this.reportModel.aggregate([
        { $match: matchStage },
        { $group: { _id: { type: '$target.type', id: '$target.id' } } },
        { $count: 'total' },
      ]).exec(),
    ]);

    const total = totalResults[0]?.total || 0;

    // İçerikleri enrichment
    const queueItems: ModerationQueueItem[] = [];

    for (const result of results) {
      const targetType = result._id.type;
      const targetId = result._id.id;

      let content = null;
      if (targetType === 'post') {
        content = await this.postModel.findById(targetId).lean().exec();
      } else if (targetType === 'comment') {
        content = await this.commentModel.findById(targetId).lean().exec();
      }

      if (content) {
        queueItems.push({
          id: targetId.toString(),
          type: targetType,
          content,
          reportCount: result.reportCount,
          latestReport: result.latestReport,
          createdAt: content.createdAt,
        });
      }
    }

    return {
      success: true,
      data: queueItems,
      pagination: {
        total,
        page,
        limit,
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Postu gizle (soft hide)
   */
  async hidePost(postId: string, adminId: string, ip: string, reason?: string): Promise<Post> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Geçersiz post ID');
    }

    const post = await this.postModel.findById(postId).exec();

    if (!post) {
      throw new NotFoundException('Post bulunamadı');
    }

    if (post.status === 'hidden') {
      throw new BadRequestException('Post zaten gizli');
    }

    const previousStatus = post.status;
    post.status = 'hidden';
    await post.save();

    // İlgili raporları güncelle
    await this.reportModel.updateMany(
      { 'target.type': 'post', 'target.id': new Types.ObjectId(postId), status: 'pending' },
      {
        $set: {
          status: 'resolved',
          resolution: {
            action: 'content_removed',
            resolvedBy: new Types.ObjectId(adminId),
            resolvedAt: new Date(),
            notes: reason || 'Post gizlendi',
          },
        },
      },
    );

    // Audit log
    await this.createLog(adminId, AdminAction.POST_HIDDEN, 'post', postId, {
      before: { status: previousStatus },
      after: { status: 'hidden' },
      reason,
    }, ip);

    this.logger.log(`Post gizlendi: ${postId} - Admin: ${adminId}`);

    return post;
  }

  /**
   * Postu sil (soft delete)
   */
  async deletePost(postId: string, adminId: string, ip: string, reason?: string): Promise<void> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Geçersiz post ID');
    }

    const post = await this.postModel.findById(postId).exec();

    if (!post) {
      throw new NotFoundException('Post bulunamadı');
    }

    if (post.status === 'deleted') {
      throw new BadRequestException('Post zaten silinmiş');
    }

    const previousStatus = post.status;
    post.status = 'deleted';
    await post.save();

    // İlgili raporları güncelle
    await this.reportModel.updateMany(
      { 'target.type': 'post', 'target.id': new Types.ObjectId(postId), status: 'pending' },
      {
        $set: {
          status: 'resolved',
          resolution: {
            action: 'content_removed',
            resolvedBy: new Types.ObjectId(adminId),
            resolvedAt: new Date(),
            notes: reason || 'Post silindi',
          },
        },
      },
    );

    // Audit log
    await this.createLog(adminId, AdminAction.POST_DELETED, 'post', postId, {
      before: { status: previousStatus },
      after: { status: 'deleted' },
      reason,
    }, ip);

    this.logger.log(`Post silindi: ${postId} - Admin: ${adminId}`);
  }

  /**
   * Yorumu sil
   */
  async deleteComment(commentId: string, adminId: string, ip: string, reason?: string): Promise<void> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Geçersiz yorum ID');
    }

    const comment = await this.commentModel.findById(commentId).exec();

    if (!comment) {
      throw new NotFoundException('Yorum bulunamadı');
    }

    if (comment.status === 'deleted') {
      throw new BadRequestException('Yorum zaten silinmiş');
    }

    const previousStatus = comment.status;
    comment.status = 'deleted';
    await comment.save();

    // Post'un yorum sayısını güncelle
    await this.postModel.findByIdAndUpdate(comment.postId, {
      $inc: { 'stats.commentsCount': -1 },
    });

    // İlgili raporları güncelle
    await this.reportModel.updateMany(
      { 'target.type': 'comment', 'target.id': new Types.ObjectId(commentId), status: 'pending' },
      {
        $set: {
          status: 'resolved',
          resolution: {
            action: 'content_removed',
            resolvedBy: new Types.ObjectId(adminId),
            resolvedAt: new Date(),
            notes: reason || 'Yorum silindi',
          },
        },
      },
    );

    // Audit log
    await this.createLog(adminId, AdminAction.COMMENT_DELETED, 'comment', commentId, {
      before: { status: previousStatus },
      after: { status: 'deleted' },
      reason,
    }, ip);

    this.logger.log(`Yorum silindi: ${commentId} - Admin: ${adminId}`);
  }

  /**
   * Raporları listele
   */
  async getReports(query: ReportQueryDto): Promise<ReportListResponseDto> {
    const {
      page = 1,
      limit = 20,
      status,
      reason,
      targetType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (reason) {
      filter.reason = reason;
    }

    if (targetType) {
      filter['target.type'] = targetType;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [reports, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.reportModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: reports,
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
   * Rapor detayı getir
   */
  async getReportById(reportId: string): Promise<Report> {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new BadRequestException('Geçersiz rapor ID');
    }

    const report = await this.reportModel.findById(reportId).lean().exec();

    if (!report) {
      throw new NotFoundException('Rapor bulunamadı');
    }

    return report;
  }

  /**
   * Raporu çöz
   */
  async resolveReport(
    reportId: string,
    dto: ReportActionDto,
    adminId: string,
    ip: string,
  ): Promise<Report> {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new BadRequestException('Geçersiz rapor ID');
    }

    const report = await this.reportModel.findById(reportId).exec();

    if (!report) {
      throw new NotFoundException('Rapor bulunamadı');
    }

    if (report.status === 'resolved' || report.status === 'dismissed') {
      throw new BadRequestException('Rapor zaten işlenmiş');
    }

    const previousStatus = report.status;

    report.status = dto.status;
    report.resolution = {
      action: dto.action,
      resolvedBy: new Types.ObjectId(adminId),
      resolvedAt: new Date(),
      notes: dto.notes,
    };
    await report.save();

    // Eğer aksiyon alındıysa, hedef içeriği de işle
    if (dto.action === 'content_removed') {
      if (report.target.type === 'post') {
        await this.deletePost(report.target.id.toString(), adminId, ip, dto.notes);
      } else if (report.target.type === 'comment') {
        await this.deleteComment(report.target.id.toString(), adminId, ip, dto.notes);
      }
    }

    // Audit log
    await this.createLog(adminId, AdminAction.REPORT_RESOLVED, 'report', reportId, {
      before: { status: previousStatus },
      after: { status: dto.status, action: dto.action },
      notes: dto.notes,
    }, ip);

    this.logger.log(`Rapor çözüldü: ${reportId} - Admin: ${adminId}`);

    return this.getReportById(reportId);
  }

  /**
   * Raporu reddet
   */
  async dismissReport(reportId: string, adminId: string, ip: string, notes?: string): Promise<Report> {
    return this.resolveReport(
      reportId,
      {
        status: 'dismissed',
        action: 'none',
        notes: notes || 'Rapor reddedildi',
      },
      adminId,
      ip,
    );
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
