/**
 * Message Controller
 * HTTP REST API endpoint'leri
 * WebSocket'e alternatif olarak kullanılabilir (offline fallback)
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { MessageService } from './message.service';
import { ConversationService } from './services/conversation.service';
import { MessageCrudService } from './services/message-crud.service';

// DTOs
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { UpdateMessagingSettingsDto } from './dto/update-messaging-settings.dto';

// Response wrapper
import { ApiResponse, PaginatedResponse } from './dto/api-response.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
    private readonly messageCrudService: MessageCrudService,
  ) {}

  // ==================== CONVERSATIONS ====================

  /**
   * Kullanıcının sohbetlerini getir
   * GET /conversations
   */
  @Get('conversations')
  async getConversations(
    @CurrentUser('userId') userId: string,
    @Query() query: MessageQueryDto,
  ): Promise<PaginatedResponse<any>> {
    const result = await this.conversationService.getUserConversations(
      userId,
      query,
    );

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Yeni sohbet oluştur
   * POST /conversations
   */
  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateConversationDto,
  ): Promise<ApiResponse<any>> {
    const conversation = await this.conversationService.createConversation(
      userId,
      dto,
    );

    return {
      success: true,
      data: conversation,
    };
  }

  /**
   * Tek sohbet getir
   * GET /conversations/:id
   */
  @Get('conversations/:id')
  async getConversation(
    @CurrentUser('userId') userId: string,
    @Param('id') conversationId: string,
  ): Promise<ApiResponse<any>> {
    const conversation = await this.conversationService.getConversationById(
      conversationId,
      userId,
    );

    return {
      success: true,
      data: conversation,
    };
  }

  /**
   * Sohbet güncelle (arşivle, sessize al)
   * PATCH /conversations/:id
   */
  @Patch('conversations/:id')
  async updateConversation(
    @CurrentUser('userId') userId: string,
    @Param('id') conversationId: string,
    @Body() dto: UpdateConversationDto,
  ): Promise<ApiResponse<any>> {
    const conversation = await this.conversationService.updateConversation(
      conversationId,
      userId,
      dto,
    );

    return {
      success: true,
      data: conversation,
    };
  }

  /**
   * Sohbeti sil (kullanıcı için)
   * DELETE /conversations/:id
   */
  @Delete('conversations/:id')
  @HttpCode(HttpStatus.OK)
  async deleteConversation(
    @CurrentUser('userId') userId: string,
    @Param('id') conversationId: string,
  ): Promise<ApiResponse<void>> {
    await this.conversationService.deleteConversationForUser(
      conversationId,
      userId,
    );

    return {
      success: true,
    };
  }

  // ==================== MESSAGES ====================

  /**
   * Sohbetteki mesajları getir
   * GET /conversations/:id/messages
   */
  @Get('conversations/:id/messages')
  async getMessages(
    @CurrentUser('userId') userId: string,
    @Param('id') conversationId: string,
    @Query() query: MessageQueryDto,
  ): Promise<PaginatedResponse<any>> {
    // Önce kullanıcının bu sohbette olduğunu kontrol et
    await this.conversationService.validateParticipant(conversationId, userId);

    const result = await this.messageCrudService.getMessages(
      conversationId,
      userId,
      query,
    );

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Mesaj gönder (HTTP fallback)
   * POST /conversations/:id/messages
   */
  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser('userId') userId: string,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ): Promise<ApiResponse<any>> {
    // Önce kullanıcının bu sohbette olduğunu kontrol et
    await this.conversationService.validateParticipant(conversationId, userId);

    const message = await this.messageService.sendMessage(
      userId,
      conversationId,
      dto,
    );

    return {
      success: true,
      data: message,
    };
  }

  /**
   * Mesajı okundu olarak işaretle
   * POST /conversations/:id/read
   */
  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentUser('userId') userId: string,
    @Param('id') conversationId: string,
    @Body('messageId') messageId: string,
  ): Promise<ApiResponse<void>> {
    await this.messageService.markAsRead(conversationId, userId, messageId);

    return {
      success: true,
    };
  }

  /**
   * Mesaj sil (kullanıcı için)
   * DELETE /messages/:id
   */
  @Delete('messages/:id')
  @HttpCode(HttpStatus.OK)
  async deleteMessage(
    @CurrentUser('userId') userId: string,
    @Param('id') messageId: string,
    @Query('forEveryone') forEveryone?: boolean,
  ): Promise<ApiResponse<void>> {
    await this.messageCrudService.deleteMessage(messageId, userId, forEveryone);

    return {
      success: true,
    };
  }

  // ==================== SETTINGS ====================

  /**
   * Mesajlaşma ayarlarını getir
   * GET /messages/settings
   */
  @Get('messages/settings')
  async getSettings(
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse<any>> {
    const settings = await this.messageService.getMessagingSettings(userId);

    return {
      success: true,
      data: settings,
    };
  }

  /**
   * Mesajlaşma ayarlarını güncelle
   * PATCH /messages/settings
   */
  @Patch('messages/settings')
  async updateSettings(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateMessagingSettingsDto,
  ): Promise<ApiResponse<any>> {
    const settings = await this.messageService.updateMessagingSettings(
      userId,
      dto,
    );

    return {
      success: true,
      data: settings,
    };
  }
}
