/**
 * Public Decorator
 * Auth gerektirmeyen endpoint'leri işaretler
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Endpoint'i public olarak işaretler (auth gerekmez)
 * 
 * @example
 * @Public()
 * @Post('login')
 * login(@Body() dto: LoginDto) {
 *   return this.authService.login(dto);
 * }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
