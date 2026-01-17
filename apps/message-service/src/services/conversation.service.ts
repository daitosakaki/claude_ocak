/**
 * Conversation Service
 * Sohbet CRUD ve yönetim işlemleri
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from '../schemas/conversation.schema';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { UpdateConversationDto } from '../dto/update-conversation.dto';
import { MessageQueryDto } from '../dto/message-query.dto';
import { PresenceService } from './presence.service';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    private readonly presenceService: PresenceService,
  ) {}

  /**
   * Kullanıcının sohbetlerini getir
   */
  async getUserConversations(userId: string, query: MessageQueryDto) {
    const userObjectId = new Types.ObjectId(userId);

    // Query oluştur
    const filter: any = {
      'participants.userId': userObjectId,
      'participants.isDeleted': false,
      status: 'active',
    };

    // Arşivlenmiş sohbetleri dahil etme
    if (!query.includeArchived) {
      filter['participants.isArchived'] = false;
    }

    // Cursor-based pagination
    if (query.cursor) {
      filter.updatedAt = { $lt: new Date(query.cursor) };
    }

    const conversations = await this.conversationModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(query.limit + 1) // Bir fazla al (hasMore için)
      .lean();

    // hasMore kontrolü
    const hasMore = conversations.length > query.limit;
    if (hasMore) {
      conversations.pop();
    }

    // Katılımcıların online durumlarını ekle
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const participants = await this.enrichParticipants(
          conv.participants,
          userId,
        );
        const userParticipant = conv.participants.find(
          (p) => p.userId.toString() === userId,
        );

        return {
          ...conv,
          id: conv._id.toString(),
          participants,
          unreadCount: userParticipant?.unreadCount || 0,
          isArchived: userParticipant?.isArchived || false,
          isMuted: userParticipant?.isMuted || false,
          mutedUntil: userParticipant?.mutedUntil,
        };
      }),
    );

    return {
      data: enrichedConversations,
      pagination: {
        limit: query.limit,
        hasMore,
        nextCursor: hasMore
          ? conversations[conversations.length - 1].updatedAt.toISOString()
          : undefined,
      },
    };
  }

  /**
   * Yeni sohbet oluştur
   */
  async createConversation(userId: string, dto: CreateConversationDto) {
    const userObjectId = new Types.ObjectId(userId);

    // Direct sohbet için duplicate kontrolü
    if (dto.type === 'direct' && dto.participantIds.length === 1) {
      const otherUserId = new Types.ObjectId(dto.participantIds[0]);

      const existingConversation = await this.conversationModel.findOne({
        type: 'direct',
        'participants.userId': { $all: [userObjectId, otherUserId] },
        status: 'active',
      });

      if (existingConversation) {
        // Mevcut sohbeti döndür (silindiyse geri getir)
        await this.conversationModel.updateOne(
          {
            _id: existingConversation._id,
            'participants.userId': userObjectId,
          },
          {
            $set: { 'participants.$.isDeleted': false },
          },
        );

        return existingConversation;
      }
    }

    // Katılımcı listesi oluştur
    const participants = [
      {
        userId: userObjectId,
        role: dto.type === 'group' ? 'admin' : 'member',
        joinedAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isMuted: false,
        isDeleted: false,
      },
      ...dto.participantIds.map((id) => ({
        userId: new Types.ObjectId(id),
        role: 'member',
        joinedAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isMuted: false,
        isDeleted: false,
      })),
    ];

    // Yeni sohbet oluştur
    const conversation = new this.conversationModel({
      type: dto.type || 'direct',
      participants,
      group: dto.group,
      relatedTo: dto.relatedTo
        ? {
            type: dto.relatedTo.type,
            id: new Types.ObjectId(dto.relatedTo.id),
          }
        : undefined,
      status: 'active',
    });

    await conversation.save();

    this.logger.debug(`Yeni sohbet oluşturuldu: ${conversation._id}`);

    return conversation;
  }

  /**
   * Tek sohbet getir
   */
  async getConversationById(conversationId: string, userId: string) {
    const conversation = await this.conversationModel
      .findOne({
        _id: new Types.ObjectId(conversationId),
        'participants.userId': new Types.ObjectId(userId),
        'participants.isDeleted': false,
        status: 'active',
      })
      .lean();

    if (!conversation) {
      throw new NotFoundException('Sohbet bulunamadı');
    }

    const participants = await this.enrichParticipants(
      conversation.participants,
      userId,
    );

    const userParticipant = conversation.participants.find(
      (p) => p.userId.toString() === userId,
    );

    return {
      ...conversation,
      id: conversation._id.toString(),
      participants,
      unreadCount: userParticipant?.unreadCount || 0,
      isArchived: userParticipant?.isArchived || false,
      isMuted: userParticipant?.isMuted || false,
      mutedUntil: userParticipant?.mutedUntil,
    };
  }

  /**
   * Sohbet güncelle
   */
  async updateConversation(
    conversationId: string,
    userId: string,
    dto: UpdateConversationDto,
  ) {
    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      'participants.userId': new Types.ObjectId(userId),
      'participants.isDeleted': false,
    });

    if (!conversation) {
      throw new NotFoundException('Sohbet bulunamadı');
    }

    // Kullanıcı bazlı ayarları güncelle
    const update: any = {};

    if (dto.isArchived !== undefined) {
      update['participants.$.isArchived'] = dto.isArchived;
    }

    if (dto.isMuted !== undefined) {
      update['participants.$.isMuted'] = dto.isMuted;
    }

    if (dto.mutedUntil !== undefined) {
      update['participants.$.mutedUntil'] = dto.mutedUntil
        ? new Date(dto.mutedUntil)
        : null;
    }

    // Grup bilgisi güncelleme (sadece admin)
    if (dto.group && conversation.type === 'group') {
      const userParticipant = conversation.participants.find(
        (p) => p.userId.toString() === userId,
      );

      if (userParticipant?.role !== 'admin') {
        throw new ForbiddenException('Grup bilgisini güncelleme yetkiniz yok');
      }

      if (dto.group.name) update['group.name'] = dto.group.name;
      if (dto.group.avatar) update['group.avatar'] = dto.group.avatar;
      if (dto.group.description)
        update['group.description'] = dto.group.description;
    }

    await this.conversationModel.updateOne(
      {
        _id: new Types.ObjectId(conversationId),
        'participants.userId': new Types.ObjectId(userId),
      },
      { $set: update },
    );

    return this.getConversationById(conversationId, userId);
  }

  /**
   * Sohbeti kullanıcı için sil (soft delete)
   */
  async deleteConversationForUser(conversationId: string, userId: string) {
    const result = await this.conversationModel.updateOne(
      {
        _id: new Types.ObjectId(conversationId),
        'participants.userId': new Types.ObjectId(userId),
      },
      {
        $set: { 'participants.$.isDeleted': true },
      },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException('Sohbet bulunamadı');
    }

    this.logger.debug(`Sohbet silindi (user): ${conversationId} - ${userId}`);
  }

  /**
   * Kullanıcının bu sohbette olduğunu doğrula
   */
  async validateParticipant(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      'participants.userId': new Types.ObjectId(userId),
      'participants.isDeleted': false,
      status: 'active',
    });

    if (!conversation) {
      throw new ForbiddenException('Bu sohbetin katılımcısı değilsiniz');
    }
  }

  /**
   * Kullanıcının sohbet ID'lerini getir
   */
  async getUserConversationIds(userId: string): Promise<string[]> {
    const conversations = await this.conversationModel
      .find({
        'participants.userId': new Types.ObjectId(userId),
        'participants.isDeleted': false,
        status: 'active',
      })
      .select('_id')
      .lean();

    return conversations.map((c) => c._id.toString());
  }

  /**
   * Sohbetteki offline katılımcıları getir
   */
  async getOfflineParticipants(
    conversationId: string,
    excludeUserId: string,
  ): Promise<string[]> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .lean();

    if (!conversation) return [];

    const offlineParticipants: string[] = [];

    for (const participant of conversation.participants) {
      const participantId = participant.userId.toString();

      if (participantId === excludeUserId) continue;
      if (participant.isDeleted) continue;

      const isOnline = await this.presenceService.isOnline(participantId);
      if (!isOnline) {
        offlineParticipants.push(participantId);
      }
    }

    return offlineParticipants;
  }

  /**
   * Sohbetin tüm katılımcılarını getir (userId hariç)
   */
  async getConversationParticipants(userId: string): Promise<string[]> {
    const conversations = await this.conversationModel
      .find({
        'participants.userId': new Types.ObjectId(userId),
        'participants.isDeleted': false,
        status: 'active',
      })
      .select('participants')
      .lean();

    const participantIds = new Set<string>();

    for (const conv of conversations) {
      for (const p of conv.participants) {
        const pId = p.userId.toString();
        if (pId !== userId && !p.isDeleted) {
          participantIds.add(pId);
        }
      }
    }

    return Array.from(participantIds);
  }

  /**
   * Son mesajı güncelle
   */
  async updateLastMessage(
    conversationId: string,
    lastMessage: {
      messageId: string;
      senderId: string;
      preview: string;
      type: string;
      sentAt: Date;
    },
  ) {
    await this.conversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      {
        $set: {
          lastMessage: {
            messageId: new Types.ObjectId(lastMessage.messageId),
            senderId: new Types.ObjectId(lastMessage.senderId),
            preview: lastMessage.preview,
            type: lastMessage.type,
            sentAt: lastMessage.sentAt,
          },
          updatedAt: new Date(),
        },
        $inc: {
          messagesCount: 1,
          // Gönderen hariç tüm katılımcıların unread count'unu artır
          'participants.$[other].unreadCount': 1,
        },
      },
      {
        arrayFilters: [
          {
            'other.userId': { $ne: new Types.ObjectId(lastMessage.senderId) },
          },
        ],
      },
    );
  }

  /**
   * Okunmamış sayısını sıfırla
   */
  async resetUnreadCount(conversationId: string, userId: string) {
    await this.conversationModel.updateOne(
      {
        _id: new Types.ObjectId(conversationId),
        'participants.userId': new Types.ObjectId(userId),
      },
      {
        $set: {
          'participants.$.unreadCount': 0,
          'participants.$.lastReadAt': new Date(),
        },
      },
    );
  }

  /**
   * Katılımcı bilgilerini zenginleştir
   */
  private async enrichParticipants(participants: any[], currentUserId: string) {
    // Gerçek implementasyonda user-service'den bilgi çekilir
    // Burada basitleştirilmiş versiyon

    const enriched = [];

    for (const p of participants) {
      if (p.userId.toString() === currentUserId) continue;

      const isOnline = await this.presenceService.isOnline(p.userId.toString());

      enriched.push({
        id: p.userId.toString(),
        username: `user_${p.userId.toString().slice(-6)}`, // Placeholder
        displayName: `User ${p.userId.toString().slice(-6)}`, // Placeholder
        avatar: null,
        isOnline,
      });
    }

    return enriched;
  }
}
