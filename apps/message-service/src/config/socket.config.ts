/**
 * Socket Config
 * WebSocket (Socket.IO) ayarları
 */

import { registerAs } from '@nestjs/config';

export default registerAs('socket', () => ({
  // Transport ayarları
  transports: ['websocket', 'polling'],

  // Ping/Pong ayarları
  pingInterval: 25000, // 25 saniye
  pingTimeout: 20000, // 20 saniye

  // Bağlantı ayarları
  connectTimeout: 30000, // 30 saniye
  upgradeTimeout: 10000, // 10 saniye

  // Buffer ayarları
  maxHttpBufferSize: 1e6, // 1MB

  // CORS
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['*'],
    methods: ['GET', 'POST'],
    credentials: true,
  },

  // Room ayarları
  rooms: {
    user: (userId: string) => `user:${userId}`,
    conversation: (convId: string) => `conversation:${convId}`,
  },

  // Event names
  events: {
    // Client -> Server
    authenticate: 'authenticate',
    messageSend: 'message:send',
    messageDelivered: 'message:delivered',
    messageRead: 'message:read',
    typingStart: 'typing:start',
    typingStop: 'typing:stop',
    conversationJoin: 'conversation:join',
    conversationLeave: 'conversation:leave',
    presenceUpdate: 'presence:update',
    keysGet: 'keys:get',

    // Server -> Client
    authenticated: 'authenticated',
    messageNew: 'message:new',
    messageSent: 'message:sent',
    messageDeliveredAck: 'message:delivered',
    messageReadAck: 'message:read',
    typingUpdate: 'typing:update',
    presenceUpdateAck: 'presence:update',
    conversationUpdated: 'conversation:updated',
    keysResponse: 'keys:response',
    error: 'error',
  },

  // Reconnection ayarları (client tarafı için referans)
  reconnection: {
    enabled: true,
    attempts: 10,
    delay: 1000, // 1 saniye
    maxDelay: 30000, // 30 saniye
    randomizationFactor: 0.5,
  },
}));
