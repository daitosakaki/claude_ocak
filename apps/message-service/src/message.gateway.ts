/**
 * Message Gateway
 * WebSocket (Socket.IO) event handler'ları
 * Real-time mesajlaşma için ana gateway
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Services
import { MessageService } from './message.service';
import { ConversationService } from './services/conversation.service';
import { PresenceService } from './services/presence.service';
import { TypingService } from './services/typing.service';
import { DeliveryService } from './services/delivery.service';

// Guards
import { WsAuthGuard } from './guards/ws-auth.guard';

// DTOs & Events
import { SendMessageDto } from './dto/send-message.dto';
import {
  SocketEvents,
  AuthenticatePayload,
  MessageSendPayload,
  TypingPayload,
  ConversationJoinPayload,
  MessageDeliveredPayload,
  MessageReadPayload,
  KeysGetPayload,
} from './events/socket.events';

@WebSocketGateway({
  namespace: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class MessageGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessageGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
    private readonly presenceService: PresenceService,
    private readonly typingService: TypingService,
    private readonly deliveryService: DeliveryService,
  ) {}

  /**
   * Gateway başlatıldığında
   */
  afterInit(server: Server) {
    this.logger.log('🔌 WebSocket Gateway başlatıldı');
  }

  /**
   * Yeni bağlantı kurulduğunda
   */
  async handleConnection(client: Socket) {
    this.logger.debug(`Client bağlandı: ${client.id}`);
    // Auth bekleniyor, henüz bir şey yapma
  }

  /**
   * Bağlantı kesildiğinde
   */
  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;

    if (userId) {
      // Online durumunu güncelle
      await this.presenceService.setOffline(userId, client.id);

      // Takipçilere offline bildir
      await this.notifyPresenceChange(userId, 'offline');

      this.logger.debug(`Client ayrıldı: ${client.id} (User: ${userId})`);
    }
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Client kimlik doğrulaması
   * Event: authenticate
   */
  @SubscribeMessage(SocketEvents.AUTHENTICATE)
  async handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AuthenticatePayload,
  ) {
    try {
      // Token doğrula
      const decoded = this.jwtService.verify(payload.token);
      const userId = decoded.sub || decoded.userId;

      if (!userId) {
        client.emit(SocketEvents.ERROR, {
          code: 'AUTH_FAILED',
          message: 'Geçersiz token',
        });
        return;
      }

      // Socket'e user bilgisi ekle
      client.data.userId = userId;
      client.data.authenticatedAt = new Date();

      // User room'una katıl
      client.join(`user:${userId}`);

      // Online durumunu güncelle
      await this.presenceService.setOnline(userId, client.id);

      // Kullanıcının sohbetlerine katıl
      const conversations =
        await this.conversationService.getUserConversationIds(userId);
      conversations.forEach((convId) => {
        client.join(`conversation:${convId}`);
      });

      // Takipçilere online bildir
      await this.notifyPresenceChange(userId, 'online');

      // Başarılı yanıt
      client.emit(SocketEvents.AUTHENTICATED, {
        userId,
        sessionId: client.id,
        connectedAt: new Date().toISOString(),
      });

      this.logger.debug(`Client doğrulandı: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.error(`Auth hatası: ${error.message}`);
      client.emit(SocketEvents.ERROR, {
        code: 'AUTH_FAILED',
        message: 'Token doğrulaması başarısız',
      });
    }
  }

  // ==================== MESSAGING ====================

  /**
   * Mesaj gönder
   * Event: message:send
   */
  @SubscribeMessage(SocketEvents.MESSAGE_SEND)
  @UseGuards(WsAuthGuard)
  async handleMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageSendPayload,
  ) {
    const userId = client.data.userId;

    try {
      // Kullanıcının bu sohbette olduğunu kontrol et
      await this.conversationService.validateParticipant(
        payload.conversationId,
        userId,
      );

      // Mesajı kaydet
      const message = await this.messageService.sendMessage(
        userId,
        payload.conversationId,
        {
          type: payload.type,
          encrypted: payload.encrypted,
          media: payload.media,
          replyTo: payload.replyTo,
        } as SendMessageDto,
      );

      // Gönderene ACK
      client.emit(SocketEvents.MESSAGE_SENT, {
        tempId: payload.tempId,
        messageId: message.id,
        conversationId: payload.conversationId,
        sentAt: message.createdAt,
      });

      // Sohbetteki diğer kullanıcılara mesajı ilet
      client.to(`conversation:${payload.conversationId}`).emit(
        SocketEvents.MESSAGE_NEW,
        {
          id: message.id,
          conversationId: payload.conversationId,
          senderId: userId,
          type: payload.type,
          encrypted: payload.encrypted,
          media: payload.media,
          replyTo: payload.replyTo,
          senderPublicKey: message.senderPublicKey,
          createdAt: message.createdAt,
        },
      );

      this.logger.debug(
        `Mesaj gönderildi: ${message.id} (Conv: ${payload.conversationId})`,
      );
    } catch (error) {
      this.logger.error(`Mesaj gönderme hatası: ${error.message}`);
      client.emit(SocketEvents.ERROR, {
        code: 'MESSAGE_FAILED',
        message: error.message,
        tempId: payload.tempId,
      });
    }
  }

  /**
   * Mesaj iletildi bildirimi
   * Event: message:delivered
   */
  @SubscribeMessage(SocketEvents.MESSAGE_DELIVERED)
  @UseGuards(WsAuthGuard)
  async handleMessageDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageDeliveredPayload,
  ) {
    const userId = client.data.userId;

    try {
      const result = await this.deliveryService.markDelivered(
        payload.messageId,
        userId,
      );

      if (result) {
        // Mesajın gönderenine iletildi bilgisi gönder
        this.server.to(`user:${result.senderId}`).emit(
          SocketEvents.MESSAGE_DELIVERED,
          {
            messageId: payload.messageId,
            conversationId: result.conversationId,
            deliveredTo: userId,
            deliveredAt: new Date().toISOString(),
          },
        );
      }
    } catch (error) {
      this.logger.error(`Delivery hatası: ${error.message}`);
    }
  }

  /**
   * Mesaj okundu bildirimi
   * Event: message:read
   */
  @SubscribeMessage(SocketEvents.MESSAGE_READ)
  @UseGuards(WsAuthGuard)
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageReadPayload,
  ) {
    const userId = client.data.userId;

    try {
      await this.messageService.markAsRead(
        payload.conversationId,
        userId,
        payload.messageId,
      );

      // Sohbetteki diğer kullanıcılara okundu bilgisi gönder
      client.to(`conversation:${payload.conversationId}`).emit(
        SocketEvents.MESSAGE_READ,
        {
          conversationId: payload.conversationId,
          messageId: payload.messageId,
          readBy: userId,
          readAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      this.logger.error(`Read hatası: ${error.message}`);
    }
  }

  // ==================== TYPING ====================

  /**
   * Yazıyor başlat
   * Event: typing:start
   */
  @SubscribeMessage(SocketEvents.TYPING_START)
  @UseGuards(WsAuthGuard)
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const userId = client.data.userId;

    try {
      await this.typingService.startTyping(payload.conversationId, userId);

      // Sohbetteki diğer kullanıcılara bildir
      client.to(`conversation:${payload.conversationId}`).emit(
        SocketEvents.TYPING_UPDATE,
        {
          conversationId: payload.conversationId,
          userId,
          isTyping: true,
          timestamp: new Date().toISOString(),
        },
      );
    } catch (error) {
      this.logger.error(`Typing start hatası: ${error.message}`);
    }
  }

  /**
   * Yazıyor durdur
   * Event: typing:stop
   */
  @SubscribeMessage(SocketEvents.TYPING_STOP)
  @UseGuards(WsAuthGuard)
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const userId = client.data.userId;

    try {
      await this.typingService.stopTyping(payload.conversationId, userId);

      // Sohbetteki diğer kullanıcılara bildir
      client.to(`conversation:${payload.conversationId}`).emit(
        SocketEvents.TYPING_UPDATE,
        {
          conversationId: payload.conversationId,
          userId,
          isTyping: false,
          timestamp: new Date().toISOString(),
        },
      );
    } catch (error) {
      this.logger.error(`Typing stop hatası: ${error.message}`);
    }
  }

  // ==================== CONVERSATION ====================

  /**
   * Sohbete katıl
   * Event: conversation:join
   */
  @SubscribeMessage(SocketEvents.CONVERSATION_JOIN)
  @UseGuards(WsAuthGuard)
  async handleConversationJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ConversationJoinPayload,
  ) {
    const userId = client.data.userId;

    try {
      // Kullanıcının bu sohbette olduğunu kontrol et
      await this.conversationService.validateParticipant(
        payload.conversationId,
        userId,
      );

      // Room'a katıl
      client.join(`conversation:${payload.conversationId}`);

      this.logger.debug(
        `User ${userId} sohbete katıldı: ${payload.conversationId}`,
      );
    } catch (error) {
      this.logger.error(`Conversation join hatası: ${error.message}`);
      client.emit(SocketEvents.ERROR, {
        code: 'NOT_PARTICIPANT',
        message: 'Bu sohbetin katılımcısı değilsiniz',
      });
    }
  }

  /**
   * Sohbetten ayrıl
   * Event: conversation:leave
   */
  @SubscribeMessage(SocketEvents.CONVERSATION_LEAVE)
  @UseGuards(WsAuthGuard)
  async handleConversationLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ConversationJoinPayload,
  ) {
    client.leave(`conversation:${payload.conversationId}`);
    this.logger.debug(
      `User ${client.data.userId} sohbetten ayrıldı: ${payload.conversationId}`,
    );
  }

  // ==================== PRESENCE ====================

  /**
   * Durum güncelle
   * Event: presence:update
   */
  @SubscribeMessage(SocketEvents.PRESENCE_UPDATE)
  @UseGuards(WsAuthGuard)
  async handlePresenceUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { status: 'online' | 'away' | 'offline' },
  ) {
    const userId = client.data.userId;

    if (payload.status === 'offline') {
      await this.presenceService.setOffline(userId, client.id);
    } else {
      await this.presenceService.setOnline(userId, client.id);
    }

    await this.notifyPresenceChange(userId, payload.status);
  }

  // ==================== KEYS ====================

  /**
   * Public key iste
   * Event: keys:get
   */
  @SubscribeMessage(SocketEvents.KEYS_GET)
  @UseGuards(WsAuthGuard)
  async handleKeysGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: KeysGetPayload,
  ) {
    try {
      const keys = await this.messageService.getUserPublicKeys(payload.userId);

      client.emit(SocketEvents.KEYS_RESPONSE, {
        userId: payload.userId,
        keys,
      });
    } catch (error) {
      this.logger.error(`Keys get hatası: ${error.message}`);
      client.emit(SocketEvents.ERROR, {
        code: 'KEYS_NOT_FOUND',
        message: 'Kullanıcı anahtarları bulunamadı',
      });
    }
  }

  // ==================== PING ====================

  /**
   * Ping/Pong
   * Event: ping
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
    });
  }

  // ==================== HELPERS ====================

  /**
   * Presence değişikliğini ilgili kullanıcılara bildir
   */
  private async notifyPresenceChange(
    userId: string,
    status: 'online' | 'away' | 'offline',
  ) {
    // Kullanıcının sohbet ettiği kişileri bul
    const conversationParticipants =
      await this.conversationService.getConversationParticipants(userId);

    // Her birine presence update gönder
    conversationParticipants.forEach((participantId) => {
      this.server.to(`user:${participantId}`).emit(SocketEvents.PRESENCE_UPDATE, {
        userId,
        status,
        lastSeenAt: status === 'offline' ? new Date().toISOString() : undefined,
      });
    });
  }
}
