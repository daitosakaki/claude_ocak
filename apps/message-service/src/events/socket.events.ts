/**
 * Socket Events
 * WebSocket event isimleri ve payload tipleri
 */

// Event isimleri
export const SocketEvents = {
  // Client -> Server
  AUTHENTICATE: 'authenticate',
  MESSAGE_SEND: 'message:send',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',
  PRESENCE_UPDATE: 'presence:update',
  KEYS_GET: 'keys:get',

  // Server -> Client
  AUTHENTICATED: 'authenticated',
  MESSAGE_NEW: 'message:new',
  MESSAGE_SENT: 'message:sent',
  TYPING_UPDATE: 'typing:update',
  CONVERSATION_UPDATED: 'conversation:updated',
  KEYS_RESPONSE: 'keys:response',
  ERROR: 'error',
} as const;

// ==================== Client -> Server Payloads ====================

export interface AuthenticatePayload {
  token: string;
}

export interface MessageSendPayload {
  tempId: string;
  conversationId: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'file';
  encrypted: {
    content: string;
    nonce: string;
    algorithm?: string;
  };
  media?: {
    url: string;
    thumbnailUrl?: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    fileName?: string;
  };
  replyTo?: string;
}

export interface MessageDeliveredPayload {
  messageId: string;
}

export interface MessageReadPayload {
  conversationId: string;
  messageId: string;
}

export interface TypingPayload {
  conversationId: string;
}

export interface ConversationJoinPayload {
  conversationId: string;
}

export interface PresenceUpdatePayload {
  status: 'online' | 'away' | 'offline';
}

export interface KeysGetPayload {
  userId: string;
}

// ==================== Server -> Client Payloads ====================

export interface AuthenticatedResponse {
  userId: string;
  sessionId: string;
  connectedAt: string;
}

export interface MessageNewResponse {
  id: string;
  conversationId: string;
  senderId: string;
  type: string;
  encrypted: {
    content: string;
    nonce: string;
    algorithm: string;
  };
  media?: {
    url: string;
    thumbnailUrl?: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    fileName?: string;
  };
  replyTo?: string;
  senderPublicKey: string;
  createdAt: string;
}

export interface MessageSentResponse {
  tempId: string;
  messageId: string;
  conversationId: string;
  sentAt: string;
}

export interface MessageDeliveredResponse {
  messageId: string;
  conversationId: string;
  deliveredTo: string;
  deliveredAt: string;
}

export interface MessageReadResponse {
  conversationId: string;
  messageId: string;
  readBy: string;
  readAt: string;
}

export interface TypingUpdateResponse {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: string;
}

export interface PresenceUpdateResponse {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeenAt?: string;
}

export interface ConversationUpdatedResponse {
  conversationId: string;
  lastMessage: {
    id: string;
    senderId: string;
    preview: string;
    type: string;
    sentAt: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface KeysResponse {
  userId: string;
  keys: Array<{
    publicKey: string;
    deviceId: string;
    deviceName: string;
    isActive: boolean;
  }>;
}

export interface ErrorResponse {
  code: string;
  message: string;
  tempId?: string;
}
