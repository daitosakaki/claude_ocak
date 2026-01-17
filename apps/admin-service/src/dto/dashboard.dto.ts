import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';

/**
 * Zaman periyodu enum
 */
export enum TimePeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom',
}

/**
 * Dashboard sorgu parametreleri
 */
export class DashboardQueryDto {
  @ApiPropertyOptional({
    description: 'Zaman periyodu',
    enum: TimePeriod,
    default: 'last_7_days',
  })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod = TimePeriod.LAST_7_DAYS;

  @ApiPropertyOptional({
    description: 'Başlangıç tarihi (custom için)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Bitiş tarihi (custom için)',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * Dashboard istatistikleri yanıtı
 */
export class DashboardStatsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'Dashboard istatistikleri',
  })
  data: DashboardStatsDto;
}

/**
 * Dashboard istatistikleri
 */
export class DashboardStatsDto {
  @ApiProperty({
    description: 'Kullanıcı istatistikleri',
    example: {
      total: 50000,
      active: 45000,
      new: 1234,
      premium: 5000,
      banned: 100,
      suspended: 50,
      growth: 12.5,
    },
  })
  users: {
    total: number;
    active: number;
    new: number;
    premium: number;
    banned: number;
    suspended: number;
    growth: number; // Yüzde
  };

  @ApiProperty({
    description: 'İçerik istatistikleri',
    example: {
      totalPosts: 150000,
      newPosts: 5000,
      totalComments: 300000,
      newComments: 10000,
      totalLikes: 1000000,
      postsGrowth: 8.3,
    },
  })
  content: {
    totalPosts: number;
    newPosts: number;
    totalComments: number;
    newComments: number;
    totalLikes: number;
    postsGrowth: number;
  };

  @ApiProperty({
    description: 'Mesajlaşma istatistikleri',
    example: {
      totalConversations: 80000,
      totalMessages: 500000,
      newMessages: 15000,
      activeConversations: 20000,
    },
  })
  messaging: {
    totalConversations: number;
    totalMessages: number;
    newMessages: number;
    activeConversations: number;
  };

  @ApiProperty({
    description: 'Moderasyon istatistikleri',
    example: {
      pendingReports: 25,
      resolvedReports: 150,
      contentRemoved: 45,
      usersBanned: 5,
      usersSuspended: 10,
    },
  })
  moderation: {
    pendingReports: number;
    resolvedReports: number;
    contentRemoved: number;
    usersBanned: number;
    usersSuspended: number;
  };

  @ApiProperty({
    description: 'Engagement istatistikleri',
    example: {
      dau: 15000,
      mau: 45000,
      dauMauRatio: 33.3,
      avgSessionDuration: 900,
      avgPostsPerUser: 0.5,
    },
  })
  engagement: {
    dau: number; // Günlük aktif kullanıcı
    mau: number; // Aylık aktif kullanıcı
    dauMauRatio: number; // Yüzde
    avgSessionDuration: number; // Saniye
    avgPostsPerUser: number;
  };

  @ApiProperty({
    description: 'Zaman aralığı',
    example: {
      period: 'last_7_days',
      startDate: '2024-01-08',
      endDate: '2024-01-15',
    },
  })
  timeRange: {
    period: string;
    startDate: string;
    endDate: string;
  };
}

/**
 * Gerçek zamanlı istatistikler
 */
export class RealtimeStatsDto {
  @ApiProperty({
    description: 'Çevrimiçi kullanıcı sayısı',
    example: 5432,
  })
  onlineUsers: number;

  @ApiProperty({
    description: 'Aktif WebSocket bağlantıları',
    example: 4800,
  })
  activeConnections: number;

  @ApiProperty({
    description: 'Son 5 dakikadaki istekler',
    example: 15000,
  })
  requestsLast5Min: number;

  @ApiProperty({
    description: 'Son 5 dakikadaki yeni kayıtlar',
    example: 25,
  })
  signupsLast5Min: number;

  @ApiProperty({
    description: 'Son 5 dakikadaki yeni postlar',
    example: 150,
  })
  postsLast5Min: number;

  @ApiProperty({
    description: 'Son 5 dakikadaki yeni mesajlar',
    example: 500,
  })
  messagesLast5Min: number;

  @ApiProperty({
    description: 'Sunucu durumu',
    example: 'healthy',
  })
  serverStatus: 'healthy' | 'degraded' | 'down';

  @ApiProperty({
    description: 'Son güncelleme zamanı',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: string;
}

/**
 * Büyüme grafik verisi
 */
export class GrowthChartDto {
  @ApiProperty({
    description: 'Kullanıcı büyüme verisi',
    type: 'array',
  })
  userGrowth: {
    date: string;
    total: number;
    new: number;
  }[];

  @ApiProperty({
    description: 'İçerik büyüme verisi',
    type: 'array',
  })
  contentGrowth: {
    date: string;
    posts: number;
    comments: number;
    likes: number;
  }[];

  @ApiProperty({
    description: 'Engagement verisi',
    type: 'array',
  })
  engagementTrend: {
    date: string;
    dau: number;
    sessions: number;
  }[];
}
