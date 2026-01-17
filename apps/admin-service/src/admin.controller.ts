import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AdminService } from './admin.service';
import { DashboardService } from './services/dashboard.service';
import { UserManagementService } from './services/user-management.service';
import { ModerationService } from './services/moderation.service';
import { FeatureFlagService } from './services/feature-flag.service';
import { AuditLogService } from './services/audit-log.service';

import { AdminAuthGuard } from './guards/admin-auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { Permissions } from './decorators/permissions.decorator';
import { CurrentAdmin } from './decorators/current-admin.decorator';

import {
  AdminLoginDto,
  AdminLoginResponseDto,
  ChangePasswordDto,
} from './dto/admin-login.dto';
import {
  UserActionDto,
  BanUserDto,
  SuspendUserDto,
  UserQueryDto,
  UserListResponseDto,
} from './dto/user-action.dto';
import {
  ReportActionDto,
  ReportQueryDto,
  ReportListResponseDto,
} from './dto/report-action.dto';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  FeatureFlagQueryDto,
  FeatureFlagResponseDto,
} from './dto/feature-flag.dto';
import {
  DashboardStatsResponseDto,
  DashboardQueryDto,
} from './dto/dashboard.dto';
import {
  AdminLogQueryDto,
  AdminLogListResponseDto,
} from './dto/admin-log.dto';

@Controller()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dashboardService: DashboardService,
    private readonly userManagementService: UserManagementService,
    private readonly moderationService: ModerationService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ==================== AUTH ====================

  @ApiTags('auth')
  @ApiOperation({ summary: 'Admin girişi' })
  @ApiResponse({ status: 200, description: 'Başarılı giriş', type: AdminLoginResponseDto })
  @ApiResponse({ status: 401, description: 'Geçersiz kimlik bilgileri' })
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 1 dakikada 5 deneme
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    return this.adminService.login(loginDto);
  }

  @ApiTags('auth')
  @ApiOperation({ summary: 'Admin çıkışı' })
  @ApiResponse({ status: 200, description: 'Başarılı çıkış' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard)
  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentAdmin() admin: any): Promise<{ success: boolean }> {
    await this.adminService.logout(admin.id);
    return { success: true };
  }

  @ApiTags('auth')
  @ApiOperation({ summary: 'Şifre değiştir' })
  @ApiResponse({ status: 200, description: 'Şifre değiştirildi' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard)
  @Post('auth/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentAdmin() admin: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    await this.adminService.changePassword(admin.id, changePasswordDto);
    return { success: true };
  }

  @ApiTags('auth')
  @ApiOperation({ summary: 'Mevcut admin bilgisi' })
  @ApiResponse({ status: 200, description: 'Admin bilgisi' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard)
  @Get('auth/me')
  async getMe(@CurrentAdmin() admin: any): Promise<any> {
    return this.adminService.getAdminById(admin.id);
  }

  // ==================== DASHBOARD ====================

  @ApiTags('dashboard')
  @ApiOperation({ summary: 'Dashboard istatistikleri' })
  @ApiResponse({ status: 200, description: 'İstatistikler', type: DashboardStatsResponseDto })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('analytics:read')
  @Get('dashboard/stats')
  async getDashboardStats(
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardStatsResponseDto> {
    return this.dashboardService.getStats(query);
  }

  @ApiTags('dashboard')
  @ApiOperation({ summary: 'Gerçek zamanlı istatistikler' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('analytics:read')
  @Get('dashboard/realtime')
  async getRealtimeStats(): Promise<any> {
    return this.dashboardService.getRealtimeStats();
  }

  @ApiTags('dashboard')
  @ApiOperation({ summary: 'Büyüme grafikleri' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('analytics:read')
  @Get('dashboard/growth')
  async getGrowthCharts(@Query() query: DashboardQueryDto): Promise<any> {
    return this.dashboardService.getGrowthCharts(query);
  }

  // ==================== USER MANAGEMENT ====================

  @ApiTags('users')
  @ApiOperation({ summary: 'Kullanıcı listesi' })
  @ApiResponse({ status: 200, description: 'Kullanıcı listesi', type: UserListResponseDto })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('users:read')
  @Get('users')
  async getUsers(@Query() query: UserQueryDto): Promise<UserListResponseDto> {
    return this.userManagementService.getUsers(query);
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Kullanıcı detayı' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('users:read')
  @Get('users/:id')
  async getUser(@Param('id') id: string): Promise<any> {
    return this.userManagementService.getUserById(id);
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Kullanıcı güncelle' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('users:write')
  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateDto: UserActionDto,
    @CurrentAdmin() admin: any,
  ): Promise<any> {
    return this.userManagementService.updateUser(id, updateDto, admin.id);
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Kullanıcıyı yasakla' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('users:ban')
  @Post('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  async banUser(
    @Param('id') id: string,
    @Body() banDto: BanUserDto,
    @CurrentAdmin() admin: any,
  ): Promise<{ success: boolean }> {
    await this.userManagementService.banUser(id, banDto, admin.id);
    return { success: true };
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Kullanıcı yasağını kaldır' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('users:ban')
  @Post('users/:id/unban')
  @HttpCode(HttpStatus.OK)
  async unbanUser(
    @Param('id') id: string,
    @CurrentAdmin() admin: any,
  ): Promise<{ success: boolean }> {
    await this.userManagementService.unbanUser(id, admin.id);
    return { success: true };
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Kullanıcıyı askıya al' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('users:suspend')
  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendUser(
    @Param('id') id: string,
    @Body() suspendDto: SuspendUserDto,
    @CurrentAdmin() admin: any,
  ): Promise<{ success: boolean }> {
    await this.userManagementService.suspendUser(id, suspendDto, admin.id);
    return { success: true };
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Kullanıcı askıyı kaldır' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('users:suspend')
  @Post('users/:id/unsuspend')
  @HttpCode(HttpStatus.OK)
  async unsuspendUser(
    @Param('id') id: string,
    @CurrentAdmin() admin: any,
  ): Promise<{ success: boolean }> {
    await this.userManagementService.unsuspendUser(id, admin.id);
    return { success: true };
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Kullanıcıyı doğrula (mavi tik)' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('users:verify')
  @Post('users/:id/verify')
  @HttpCode(HttpStatus.OK)
  async verifyUser(
    @Param('id') id: string,
    @CurrentAdmin() admin: any,
  ): Promise<{ success: boolean }> {
    await this.userManagementService.verifyUser(id, admin.id);
    return { success: true };
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Kullanıcı doğrulamasını kaldır' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('users:verify')
  @Post('users/:id/unverify')
  @HttpCode(HttpStatus.OK)
  async unverifyUser(
    @Param('id') id: string,
    @CurrentAdmin() admin: any,
  ): Promise<{ success: boolean }> {
    await this.userManagementService.unverifyUser(id, admin.id);
    return { success: true };
  }

  // ==================== MODERATION ====================

  @ApiTags('moderation')
  @ApiOperation({ summary: 'Moderasyon kuyruğu' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('moderation:read')
  @Get('moderation/queue')
  async getModerationQueue(@Query() query: any): Promise<any> {
    return this.moderationService.getQueue(query);
  }

  @ApiTags('moderation')
  @ApiOperation({ summary: 'Post gizle' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('posts:delete')
  @Post('moderation/posts/:id/hide')
  @HttpCode(HttpStatus.OK)
  async hidePost(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentAdmin() admin: any,
  ): Promise<{ success: boolean }> {
    await this.moderationService.hidePost(id, body.reason, admin.id);
    return { success: true };
  }

  @ApiTags('moderation')
  @ApiOperation({ summary: 'Post sil' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('posts:delete')
  @Delete('moderation/posts/:id')
  async deletePost(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentAdmin() admin: any,
  ): Promise<{ success: boolean }> {
    await this.moderationService.deletePost(id, body.reason, admin.id);
    return { success: true };
  }

  @ApiTags('moderation')
  @ApiOperation({ summary: 'Yorum sil' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('posts:delete')
  @Delete('moderation/comments/:id')
  async deleteComment(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentAdmin() admin: any,
  ): Promise<{ success: boolean }> {
    await this.moderationService.deleteComment(id, body.reason, admin.id);
    return { success: true };
  }

  // ==================== REPORTS ====================

  @ApiTags('reports')
  @ApiOperation({ summary: 'Şikayet listesi' })
  @ApiResponse({ status: 200, description: 'Şikayet listesi', type: ReportListResponseDto })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('reports:read')
  @Get('reports')
  async getReports(@Query() query: ReportQueryDto): Promise<ReportListResponseDto> {
    return this.moderationService.getReports(query);
  }

  @ApiTags('reports')
  @ApiOperation({ summary: 'Şikayet detayı' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('reports:read')
  @Get('reports/:id')
  async getReport(@Param('id') id: string): Promise<any> {
    return this.moderationService.getReportById(id);
  }

  @ApiTags('reports')
  @ApiOperation({ summary: 'Şikayeti çöz' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('reports:manage')
  @Patch('reports/:id')
  async resolveReport(
    @Param('id') id: string,
    @Body() actionDto: ReportActionDto,
    @CurrentAdmin() admin: any,
  ): Promise<{ success: boolean }> {
    await this.moderationService.resolveReport(id, actionDto, admin.id);
    return { success: true };
  }

  // ==================== FEATURE FLAGS ====================

  @ApiTags('feature-flags')
  @ApiOperation({ summary: 'Feature flag listesi' })
  @ApiResponse({ status: 200, description: 'Flag listesi' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('flags:read')
  @Get('feature-flags')
  async getFeatureFlags(@Query() query: FeatureFlagQueryDto): Promise<any> {
    return this.featureFlagService.getFlags(query);
  }

  @ApiTags('feature-flags')
  @ApiOperation({ summary: 'Feature flag detayı' })
  @ApiParam({ name: 'key', description: 'Flag key' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('flags:read')
  @Get('feature-flags/:key')
  async getFeatureFlag(@Param('key') key: string): Promise<FeatureFlagResponseDto> {
    return this.featureFlagService.getFlagByKey(key);
  }

  @ApiTags('feature-flags')
  @ApiOperation({ summary: 'Feature flag oluştur' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('flags:write')
  @Post('feature-flags')
  async createFeatureFlag(
    @Body() createDto: CreateFeatureFlagDto,
    @CurrentAdmin() admin: any,
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagService.createFlag(createDto, admin.id);
  }

  @ApiTags('feature-flags')
  @ApiOperation({ summary: 'Feature flag güncelle' })
  @ApiParam({ name: 'key', description: 'Flag key' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('flags:write')
  @Patch('feature-flags/:key')
  async updateFeatureFlag(
    @Param('key') key: string,
    @Body() updateDto: UpdateFeatureFlagDto,
    @CurrentAdmin() admin: any,
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagService.updateFlag(key, updateDto, admin.id);
  }

  @ApiTags('feature-flags')
  @ApiOperation({ summary: 'Feature flag sil' })
  @ApiParam({ name: 'key', description: 'Flag key' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('flags:write')
  @Delete('feature-flags/:key')
  async deleteFeatureFlag(
    @Param('key') key: string,
    @CurrentAdmin() admin: any,
  ): Promise<{ success: boolean }> {
    await this.featureFlagService.deleteFlag(key, admin.id);
    return { success: true };
  }

  // ==================== ADMIN LOGS ====================

  @ApiTags('logs')
  @ApiOperation({ summary: 'Admin işlem logları' })
  @ApiResponse({ status: 200, description: 'Log listesi', type: AdminLogListResponseDto })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('logs:read')
  @Get('logs')
  async getAdminLogs(@Query() query: AdminLogQueryDto): Promise<AdminLogListResponseDto> {
    return this.auditLogService.getLogs(query);
  }

  @ApiTags('logs')
  @ApiOperation({ summary: 'Log detayı' })
  @ApiParam({ name: 'id', description: 'Log ID' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminAuthGuard, PermissionGuard)
  @Permissions('logs:read')
  @Get('logs/:id')
  async getAdminLog(@Param('id') id: string): Promise<any> {
    return this.auditLogService.getLogById(id);
  }
}
