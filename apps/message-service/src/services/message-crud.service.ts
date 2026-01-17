/**
 * Message CRUD Service
 * Mesaj oluşturma, okuma, silme işlemleri
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { SendMessageDto } from '../dto/send-message.dto';
import { MessageQueryDto } from '../dto/message-query.dto';

@Injectable()
export class MessageCrudService {
  private readonly logger = new Logger(MessageCrudService.name);

  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  /**
   * Mesaj oluştur
   */
  async createMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    const message = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      type: dto.type,
      encrypted: {
        content: dto.encrypted.content,
        nonce: dto.encrypted.nonce,
        algorithm: dto.encrypted.algorithm || 'x25519-aes256gcm',
      },
      media: dto.media,
      replyTo: dto.replyTo ? new Types.ObjectId(dto.replyTo) : undefined,
      senderPublicKey: 'placeholder_public_key', // Gerçek implementasyonda user-service'den alınır
      status: {
        sent: new Date(),
        delivered: [],
        read: [],
      },
      deletedFor: [],
    });

    await message.save();

    this.logger.debug(`Mesaj oluşturuldu: ${message._id}`);

    return message;
  }

  /**
   * Sohbetteki mesajları getir
   */
  async getMessages(
    conversationId: string,
    userId: string,
    query: MessageQueryDto,
  ) {
    const convObjectId = new Types.ObjectId(conversationId);
    const userObjectId = new Types.ObjectId(userId);

    // Filter oluştur
    const filter: any = {
      conversationId: convObjectId,
      deletedFor: { $ne: userObjectId }, // Kullanıcı için silinmemiş mesajlar
    };

    // Cursor-based pagination
    if (query.cursor) {
      const cursorDirection = query.order === 'asc' ? '$gt' : '$lt';
      filter._id = { [cursorDirection]: new Types.ObjectId(query.cursor) };
    }

    // After/Before filters (sync için)
    if (query.after) {
      filter._id = { $gt: new Types.ObjectId(query.after) };
    }
    if (query.before) {
      filter._id = { $lt: new Types.ObjectId(query.before) };
    }

    const sortDirection = query.order === 'asc' ? 1 : -1;

    const messages = await this.messageModel
      .find(filter)
      .sort({ _id: sortDirection })
      .limit(query.limit + 1)
      .lean();

    // hasMore kontrolü
    const hasMore = messages.length > query.limit;
    if (hasMore) {
      messages.pop();
    }

    // Mesajları formatla
    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      senderId: msg.senderId.toString(),
      type: msg.type,
      encrypted: msg.encrypted,
      media: msg.media,
      replyTo: msg.replyTo?.toString(),
      senderPublicKey: msg.senderPublicKey,
      status: {
        sent: msg.status.sent.toISOString(),
        delivered: msg.status.delivered.map((d: any) => ({
          userId: d.userId.toString(),
          at: d.at.toISOString(),
        })),
        read: msg.status.read.map((r: any) => ({
          userId: r.userId.toString(),
          at: r.at.toISOString(),
        })),
      },
      createdAt: msg.createdAt.toISOString(),
    }));

    return {
      data: formattedMessages,
      pagination: {
        limit: query.limit,
        hasMore,
        nextCursor: hasMore
          ? messages[messages.length - 1]._id.toString()
          : undefined,
      },
    };
  }

  /**
   * Tek mesaj getir
   */
  async getMessageById(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageModel
      .findOne({
        _id: new Types.ObjectId(messageId),
        deletedFor: { $ne: new Types.ObjectId(userId) },
      })
      .lean();

    if (!message) {
      throw new NotFoundException('Mesaj bulunamadı');
    }

    return message as Message;
  }

  /**
   * Mesaj sil
   * forEveryone: true ise tüm kullanıcılar için sil (sadece gönderen yapabilir)
   * forEveryone: false ise sadece bu kullanıcı için sil
   */
  async deleteMessage(
    messageId: string,
    userId: string,
    forEveryone?: boolean,
  ): Promise<void> {
    const msgObjectId = new Types.ObjectId(messageId);
    const userObjectId = new Types.ObjectId(userId);

    const message = await this.messageModel.findById(msgObjectId);

    if (!message) {
      throw new NotFoundException('Mesaj bulunamadı');
    }

    if (forEveryone) {
      // Herkes için silme - sadece gönderen yapabilir
      if (message.senderId.toString() !== userId) {
        throw new ForbiddenException('Sadece kendi mesajınızı silebilirsiniz');
      }

      // Tamamen sil
      await this.messageModel.deleteOne({ _id: msgObjectId });
      this.logger.debug(`Mesaj tamamen silindi: ${messageId}`);
    } else {
      // Sadece bu kullanıcı için sil
      await this.messageModel.updateOne(
        { _id: msgObjectId },
        { $addToSet: { deletedFor: userObjectId } },
      );
      this.logger.debug(`Mesaj kullanıcı için silindi: ${messageId} - ${userId}`);
    }
  }

  /**
   * Belirli bir tarihten sonraki mesaj sayısını getir
   * (Sync için kullanılır)
   */
  async getMessageCountAfter(
    conversationId: string,
    afterMessageId: string,
  ): Promise<number> {
    return this.messageModel.countDocuments({
      conversationId: new Types.ObjectId(conversationId),
      _id: { $gt: new Types.ObjectId(afterMessageId) },
    });
  }

  /**
   * Sohbetin toplam mesaj sayısını getir
   */
  async getTotalMessageCount(conversationId: string): Promise<number> {
    return this.messageModel.countDocuments({
      conversationId: new Types.ObjectId(conversationId),
    });
  }
}
