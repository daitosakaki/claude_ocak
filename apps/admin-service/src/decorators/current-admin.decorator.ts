/**
 * Current Admin Decorator
 * Request'ten authenticated admin bilgisini alır
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminUser } from '../schemas/admin-user.schema';

/**
 * Controller'da authenticated admin'i alır
 * 
 * @example
 * @Get('profile')
 * getProfile(@CurrentAdmin() admin: AdminUser) {
 *   return admin;
 * }
 * 
 * // Sadece ID almak için
 * @Get('logs')
 * getLogs(@CurrentAdmin('_id') adminId: string) {
 *   return this.service.getLogs(adminId);
 * }
 */
export const CurrentAdmin = createParamDecorator(
  (data: keyof AdminUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const admin = request.user;

    if (!admin) {
      return null;
    }

    // Belirli bir alan istendiyse sadece onu dön
    if (data) {
      return admin[data];
    }

    return admin;
  },
);

/**
 * Admin ID'sini almak için kısa yol
 */
export const AdminId = () => CurrentAdmin('_id');

/**
 * Admin rolünü almak için kısa yol
 */
export const AdminRole = () => CurrentAdmin('role');
