/**
 * Permissions Decorator
 * Endpoint'lere yetki gereksinimi ekler
 */

import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Endpoint için gerekli yetkileri tanımlar
 * @param permissions Gerekli yetkiler (en az biri yeterli)
 * 
 * @example
 * @Permissions('users:read')
 * @Permissions('users:write', 'users:delete')
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Yaygın yetki kombinasyonları
 */
export const UserReadPermission = () => Permissions('users:read');
export const UserWritePermission = () => Permissions('users:write');
export const UserDeletePermission = () => Permissions('users:delete');

export const PostReadPermission = () => Permissions('posts:read');
export const PostWritePermission = () => Permissions('posts:write');
export const PostDeletePermission = () => Permissions('posts:delete');

export const ReportReadPermission = () => Permissions('reports:read');
export const ReportManagePermission = () => Permissions('reports:manage');

export const FlagReadPermission = () => Permissions('flags:read');
export const FlagWritePermission = () => Permissions('flags:write');
export const FlagDeletePermission = () => Permissions('flags:delete');

export const AnalyticsPermission = () => Permissions('analytics:read');
export const LogsPermission = () => Permissions('logs:read');

export const AdminReadPermission = () => Permissions('admins:read');
export const AdminWritePermission = () => Permissions('admins:write');
export const AdminDeletePermission = () => Permissions('admins:delete');

export const SettingsReadPermission = () => Permissions('settings:read');
export const SettingsWritePermission = () => Permissions('settings:write');
