/**
 * Conversation Schema
 * Sohbet/Conversation MongoDB şeması
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

// Katılımcı alt şeması
@Schema({ _id: false })
class Participant {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['member', 'admin'], default: 'member' })
  role: string;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;

  @Prop({ type: Date })
  lastReadAt?: Date;

  @Prop({ type: Types.ObjectId })
  lastReadMessageId?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  unreadCount: number;

  @Prop({ type: Boolean, default: false })
  isArchived: boolean;

  @Prop({ type: Boolean, default: false })
  isMuted: boolean;

  @Prop({ type: Date })
  mutedUntil?: Date;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

const ParticipantSchema = SchemaFactory.createForClass(Participant);

// Grup bilgisi alt şeması
@Schema({ _id: false })
class GroupInfo {
  @Prop({ type: String, maxlength: 100 })
  name?: string;

  @Prop({ type: String })
  avatar?: string;

  @Prop({ type: String, maxlength: 500 })
  description?: string;
}

const GroupInfoSchema = SchemaFactory.createForClass(GroupInfo);

// İlişkili kayıt alt şeması
@Schema({ _id: false })
class RelatedTo {
  @Prop({ type: String, enum: ['listing', 'match'] })
  type: string;

  @Prop({ type: Types.ObjectId })
  id: Types.ObjectId;
}

const RelatedToSchema = SchemaFactory.createForClass(RelatedTo);

// Son mesaj alt şeması
@Schema({ _id: false })
class LastMessage {
  @Prop({ type: Types.ObjectId })
  messageId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  senderId: Types.ObjectId;

  @Prop({ type: String })
  preview: string;

  @Prop({ type: String })
  type: string;

  @Prop({ type: Date })
  sentAt: Date;
}

const LastMessageSchema = SchemaFactory.createForClass(LastMessage);

// Ana Conversation şeması
@Schema({
  collection: 'conversations',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Conversation {
  @Prop({
    type: String,
    enum: ['direct', 'group', 'listing', 'dating'],
    default: 'direct',
  })
  type: string;

  @Prop({ type: [ParticipantSchema], required: true })
  participants: Participant[];

  @Prop({ type: GroupInfoSchema })
  group?: GroupInfo;

  @Prop({ type: RelatedToSchema })
  relatedTo?: RelatedTo;

  @Prop({ type: LastMessageSchema })
  lastMessage?: LastMessage;

  @Prop({ type: Number, default: 0 })
  messagesCount: number;

  @Prop({ type: String, enum: ['active', 'deleted'], default: 'active' })
  status: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Indexler
ConversationSchema.index({ 'participants.userId': 1, updatedAt: -1 });
ConversationSchema.index({
  'participants.userId': 1,
  'participants.isDeleted': 1,
  updatedAt: -1,
});
ConversationSchema.index({ 'relatedTo.type': 1, 'relatedTo.id': 1 });

// Direct sohbet için unique index
ConversationSchema.index(
  {
    type: 1,
    'participants.userId': 1,
  },
  {
    unique: true,
    partialFilterExpression: { type: 'direct' },
  },
);
