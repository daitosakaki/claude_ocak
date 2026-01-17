/**
 * WebSocket Auth Guard
 * WebSocket event'leri için authentication kontrolü
 */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();

    // Socket'e authenticate sırasında eklenen userId'yi kontrol et
    if (!client.data?.userId) {
      throw new WsException({
        code: 'AUTH_REQUIRED',
        message: 'Önce authenticate event\'i gönderilmeli',
      });
    }

    return true;
  }
}
