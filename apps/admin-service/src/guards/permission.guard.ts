/**
 * Permission Guard
 * Rol ve yetki bazlı erişim kontrolü
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

// Varsayılan rol yetkileri
export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'users:read', 'users:write', 'users:delete',
    'posts:read', 'posts:write', 'posts:delete',
    'comments:read', 'comments:delete',
    'reports:read', 'reports:manage',
    'flags:read', 'flags:write', 'flags:delete',
    'analytics:read',
    'logs:read',
    'admins:read', 'admins:write', 'admins:delete',
    'settings:read', 'settings:write',
  ],
  admin: [
    'users:read', 'users:write', 'users:delete',
    'posts:read', 'posts:write', 'posts:delete',
    'comments:read', 'comments:delete',
    'reports:read', 'reports:manage',
    'flags:read', 'flags:write',
    'analytics:read',
    'logs:read',
    'settings:read',
  ],
  moderator: [
    'users:read', 'users:write',
    'posts:read', 'posts:delete',
    'comments:read', 'comments:delete',
    'reports:read', 'reports:manage',
    'logs:read',
  ],
  support: [
    'users:read',
    'posts:read',
    'comments:read',
    'reports:read',
    'logs:read',
  ],
  analyst: [
    'analytics:read',
    'logs:read',
  ],
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Gerekli yetkiler
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Yetki gerektirmeyen endpoint
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Request'ten admin bilgisini al
    const request = context.switchToHttp().getRequest();
    const admin = request.user;

    if (!admin) {
      throw new ForbiddenException('Yetkilendirme bilgisi bulunamadı');
    }

    // Admin'in yetkilerini al
    const adminPermissions = this.getAdminPermissions(admin);

    // Gerekli yetkilerden en az birine sahip mi kontrol et
    const hasPermission = requiredPermissions.some(permission =>
      adminPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır');
    }

    return true;
  }

  /**
   * Admin'in tüm yetkilerini hesapla
   * (rol bazlı + özel yetkiler)
   */
  private getAdminPermissions(admin: any): string[] {
    const rolePermissions = DEFAULT_PERMISSIONS[admin.role] || [];
    const customPermissions = admin.permissions || [];

    // Birleştir ve tekrarları kaldır
    return [...new Set([...rolePermissions, ...customPermissions])];
  }
}

/**
 * Yetki kontrolü helper fonksiyonları
 */
export function hasPermission(admin: any, permission: string): boolean {
  const rolePermissions = DEFAULT_PERMISSIONS[admin.role] || [];
  const customPermissions = admin.permissions || [];
  const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];

  return allPermissions.includes(permission);
}

export function hasAnyPermission(admin: any, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(admin, permission));
}

export function hasAllPermissions(admin: any, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(admin, permission));
}
