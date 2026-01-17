import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import {
  UpdateNotificationSettingsDto,
  RegisterDeviceDto,
} from './dto/notification-settings.dto';

// Decorators (shared-auth paketinden gelecek)
// import { JwtAuthGuard } from '@superapp/shared-auth';
// import { CurrentUser } from '@superapp/shared-auth';

/**
 * Notification Controller
 * 
 * Endpoints:
 * - GET /notifications - Bildirimleri listele
 * - GET /notifications/unread-count - Okunmamış sayısı
 * - PATCH /notifications/:id/read - Okundu işaretle
 * - POST /notifications/read-all - Tümünü okundu işaretle
 * - DELETE /notifications/:id - Bildirimi sil
 * - GET /notifications/settings - Ayarları getir
 * - PATCH /notifications/settings - Ayarları güncelle
 * - POST /notifications/devices - Cihaz kaydet (FCM token)
 * - DELETE /notifications/devices/:deviceId - Cihaz sil
 */
@Controller('notifications')
// @UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Bildirimleri listele
   * GET /notifications
   */
  @Get()
  async getNotifications(
    // @CurrentUser('id') userId: string,
    @Query() query: NotificationQueryDto,
  ) {
    // TODO: Gerçek userId auth'dan gelecek
    const userId = 'temp_user_id';
    
    const result = await this.notificationService.getNotifications(userId, query);
    
    return {
      success: true,
      data: result.notifications,
      pagination: {
        hasMore: result.hasMore,
        nextCursor: result.nextCursor,
      },
    };
  }

  /**
   * Okunmamış bildirim sayısı
   * GET /notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(
    // @CurrentUser('id') userId: string,
  ) {
    // TODO: Gerçek userId auth'dan gelecek
    const userId = 'temp_user_id';
    
    const count = await this.notificationService.getUnreadCount(userId);
    
    return {
      success: true,
      data: { count },
    };
  }

  /**
   * Tek bildirimi okundu işaretle
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    // @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    // TODO: Gerçek userId auth'dan gelecek
    const userId = 'temp_user_id';
    
    await this.notificationService.markAsRead(userId, notificationId);
    
    return {
      success: true,
    };
  }

  /**
   * Tüm bildirimleri okundu işaretle
   * POST /notifications/read-all
   */
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(
    // @CurrentUser('id') userId: string,
  ) {
    // TODO: Gerçek userId auth'dan gelecek
    const userId = 'temp_user_id';
    
    const count = await this.notificationService.markAllAsRead(userId);
    
    return {
      success: true,
      data: { markedCount: count },
    };
  }

  /**
   * Bildirimi sil
   * DELETE /notifications/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(
    // @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    // TODO: Gerçek userId auth'dan gelecek
    const userId = 'temp_user_id';
    
    await this.notificationService.deleteNotification(userId, notificationId);
    
    return {
      success: true,
    };
  }

  /**
   * Bildirim ayarlarını getir
   * GET /notifications/settings
   */
  @Get('settings')
  async getSettings(
    // @CurrentUser('id') userId: string,
  ) {
    // TODO: Gerçek userId auth'dan gelecek
    const userId = 'temp_user_id';
    
    const settings = await this.notificationService.getSettings(userId);
    
    return {
      success: true,
      data: settings,
    };
  }

  /**
   * Bildirim ayarlarını güncelle
   * PATCH /notifications/settings
   */
  @Patch('settings')
  async updateSettings(
    // @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateNotificationSettingsDto,
  ) {
    // TODO: Gerçek userId auth'dan gelecek
    const userId = 'temp_user_id';
    
    const settings = await this.notificationService.updateSettings(
      userId,
      updateDto,
    );
    
    return {
      success: true,
      data: settings,
    };
  }

  /**
   * FCM cihaz token'ı kaydet
   * POST /notifications/devices
   */
  @Post('devices')
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(
    // @CurrentUser('id') userId: string,
    @Body() registerDto: RegisterDeviceDto,
  ) {
    // TODO: Gerçek userId auth'dan gelecek
    const userId = 'temp_user_id';
    
    await this.notificationService.registerDevice(userId, registerDto);
    
    return {
      success: true,
      message: 'Cihaz başarıyla kaydedildi',
    };
  }

  /**
   * FCM cihaz token'ı sil
   * DELETE /notifications/devices/:deviceId
   */
  @Delete('devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  async removeDevice(
    // @CurrentUser('id') userId: string,
    @Param('deviceId') deviceId: string,
  ) {
    // TODO: Gerçek userId auth'dan gelecek
    const userId = 'temp_user_id';
    
    await this.notificationService.removeDevice(userId, deviceId);
    
    return {
      success: true,
    };
  }

  /**
   * Health check endpoint
   * GET /notifications/health
   */
  @Get('health')
  healthCheck() {
    return {
      success: true,
      service: 'notification-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
