/**
 * Message Response DTO
 * API response'ları için tip tanımları
 */

// Participant response
export interface ParticipantResponse {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isOnline?: boolean;
}

// Last message response
export interface LastMessageResponse {
  id: string;
  senderId: string;
  preview: string;
  type: string;
  sentAt: string;
}

// Conversation response
export interface ConversationResponse {
  id: string;
  type: 'direct' | 'group' | 'listing' | 'dating';
  participants: ParticipantResponse[];
  group?: {
    name?: string;
    avatar?: string;
    description?: string;
  };
  relatedTo?: {
    type: 'listing' | 'match';
    id: string;
  };
  lastMessage?: LastMessageResponse;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  mutedUntil?: string;
  messagesCount: number;
  createdAt: string;
  updatedAt: string;
}

// Encrypted content response
export interface EncryptedContentResponse {
  content: string;
  nonce: string;
  algorithm: string;
}

// Media response
export interface MediaResponse {
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  fileName?: string;
}

// Delivery status response
export interface DeliveryStatusResponse {
  sent: string;
  delivered: Array<{
    userId: string;
    at: string;
  }>;
  read: Array<{
    userId: string;
    at: string;
  }>;
}

// Message response
export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'file' | 'system';
  encrypted: EncryptedContentResponse;
  media?: MediaResponse;
  replyTo?: string;
  senderPublicKey?: string;
  status: DeliveryStatusResponse;
  createdAt: string;
}

// Messaging settings response
export interface MessagingSettingsResponse {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showTypingIndicator: boolean;
  showReadReceipts: boolean;
  mediaAutoDownload: 'always' | 'wifi' | 'never';
  autoDeleteMessages: 'off' | '24h' | '7d' | '30d';
  quietHours: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
  };
  blockedUsers: string[];
}
