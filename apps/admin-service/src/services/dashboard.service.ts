import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../schemas/user.schema';
import { Post, PostDocument } from '../schemas/post.schema';
import { Report, ReportDocument } from '../schemas/report.schema';
import { DashboardQueryDto, TimePeriod } from '../dto/dashboard.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
  ) {}

  /**
   * Dashboard istatistiklerini getir
   */
  async getStats(query: DashboardQueryDto): Promise<any> {
    const { startDate, endDate } = this.getDateRange(query.period, query.startDate, query.endDate);

    const [
      userStats,
      contentStats,
      moderationStats,
    ] = await Promise.all([
      this.getUserStats(startDate, endDate),
      this.getContentStats(startDate, endDate),
      this.getModerationStats(startDate, endDate),
    ]);

    return {
      success: true,
      data: {
        users: userStats,
        content: contentStats,
        messaging: {
          totalConversations: 0, // Ayrı collection
          totalMessages: 0,
          newMessages: 0,
          activeConversations: 0,
        },
        moderation: moderationStats,
        engagement: {
          dau: 0, // Redis'ten alınabilir
          mau: 0,
          dauMauRatio: 0,
          avgSessionDuration: 0,
          avgPostsPerUser: contentStats.totalPosts / Math.max(userStats.total, 1),
        },
        timeRange: {
          period: query.period,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      },
    };
  }

  /**
   * Gerçek zamanlı istatistikler
   */
  async getRealtimeStats(): Promise<any> {
    // Bu veriler normalde Redis'ten alınır
    // Şimdilik mock veri döndürüyoruz
    return {
      success: true,
      data: {
        onlineUsers: 0,
        activeConnections: 0,
        requestsLast5Min: 0,
        signupsLast5Min: 0,
        postsLast5Min: 0,
        messagesLast5Min: 0,
        serverStatus: 'healthy',
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Büyüme grafikleri
   */
  async getGrowthCharts(query: DashboardQueryDto): Promise<any> {
    const { startDate, endDate } = this.getDateRange(query.period, query.startDate, query.endDate);

    // Günlük kullanıcı büyümesi
    const userGrowth = await this.userModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          new: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Günlük içerik büyümesi
    const contentGrowth = await this.postModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          posts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      success: true,
      data: {
        userGrowth: userGrowth.map((item) => ({
          date: item._id,
          new: item.new,
        })),
        contentGrowth: contentGrowth.map((item) => ({
          date: item._id,
          posts: item.posts,
        })),
        engagementTrend: [], // Redis'ten alınabilir
      },
    };
  }

  /**
   * Kullanıcı istatistikleri
   */
  private async getUserStats(startDate: Date, endDate: Date): Promise<any> {
    const [totalUsers, statusCounts, newUsers, premiumUsers, previousNewUsers] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      this.userModel.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      this.userModel.countDocuments({
        'subscription.plan': { $ne: 'free' },
      }),
      this.userModel.countDocuments({
        createdAt: {
          $gte: this.getPreviousPeriodStart(startDate, endDate),
          $lt: startDate,
        },
      }),
    ]);

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const growth = previousNewUsers > 0 
      ? ((newUsers - previousNewUsers) / previousNewUsers) * 100 
      : 0;

    return {
      total: totalUsers,
      active: statusMap['active'] || 0,
      new: newUsers,
      premium: premiumUsers,
      banned: statusMap['banned'] || 0,
      suspended: statusMap['suspended'] || 0,
      growth: Math.round(growth * 10) / 10,
    };
  }

  /**
   * İçerik istatistikleri
   */
  private async getContentStats(startDate: Date, endDate: Date): Promise<any> {
    const [totalPosts, newPosts, previousNewPosts] = await Promise.all([
      this.postModel.countDocuments({ status: 'active' }),
      this.postModel.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'active',
      }),
      this.postModel.countDocuments({
        createdAt: {
          $gte: this.getPreviousPeriodStart(startDate, endDate),
          $lt: startDate,
        },
        status: 'active',
      }),
    ]);

    const growth = previousNewPosts > 0 
      ? ((newPosts - previousNewPosts) / previousNewPosts) * 100 
      : 0;

    return {
      totalPosts,
      newPosts,
      totalComments: 0, // Ayrı sorgu gerekli
      newComments: 0,
      totalLikes: 0,
      postsGrowth: Math.round(growth * 10) / 10,
    };
  }

  /**
   * Moderasyon istatistikleri
   */
  private async getModerationStats(startDate: Date, endDate: Date): Promise<any> {
    const [statusCounts, actionCounts] = await Promise.all([
      this.reportModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      this.reportModel.aggregate([
        {
          $match: {
            'resolution.resolvedAt': { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$resolution.action',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const actionMap = actionCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      pendingReports: statusMap['pending'] || 0,
      resolvedReports: (statusMap['resolved'] || 0) + (statusMap['dismissed'] || 0),
      contentRemoved: actionMap['content_removed'] || 0,
      usersBanned: actionMap['user_banned'] || 0,
      usersSuspended: actionMap['user_suspended'] || 0,
    };
  }

  /**
   * Tarih aralığını hesapla
   */
  private getDateRange(
    period: TimePeriod,
    customStart?: string,
    customEnd?: string,
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case TimePeriod.TODAY:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case TimePeriod.YESTERDAY:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case TimePeriod.LAST_7_DAYS:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case TimePeriod.LAST_30_DAYS:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case TimePeriod.LAST_90_DAYS:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        break;
      case TimePeriod.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case TimePeriod.LAST_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case TimePeriod.THIS_YEAR:
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case TimePeriod.CUSTOM:
        startDate = customStart ? new Date(customStart) : new Date(now);
        endDate = customEnd ? new Date(customEnd) : new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }

  /**
   * Önceki dönem başlangıcını hesapla (karşılaştırma için)
   */
  private getPreviousPeriodStart(startDate: Date, endDate: Date): Date {
    const periodLength = endDate.getTime() - startDate.getTime();
    return new Date(startDate.getTime() - periodLength);
  }
}
