// User Event Types

/**
 * Kullanıcı oluşturuldu eventi
 */
export interface UserCreatedEvent {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

/**
 * Kullanıcı güncellendi eventi
 */
export interface UserUpdatedEvent {
  userId: string;
  changes: string[]; // Değişen alanların listesi
}

/**
 * Kullanıcı takip etti eventi
 */
export interface UserFollowedEvent {
  followerId: string;
  followingId: string;
  status: 'following' | 'pending';
}

/**
 * Kullanıcı takibi bıraktı eventi
 */
export interface UserUnfollowedEvent {
  followerId: string;
  followingId: string;
}

/**
 * Kullanıcı engelledi eventi
 */
export interface UserBlockedEvent {
  blockerId: string;
  blockedId: string;
}

/**
 * Kullanıcı engelini kaldırdı eventi
 */
export interface UserUnblockedEvent {
  unblockerId: string;
  unblockedId: string;
}

/**
 * Kullanıcı durumu değişti eventi
 */
export interface UserStatusChangedEvent {
  userId: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
}

/**
 * Kullanıcı doğrulandı eventi
 */
export interface UserVerifiedEvent {
  userId: string;
  verificationType: 'email' | 'phone' | 'identity';
}

// Event isimleri
export const USER_EVENTS = {
  CREATED: 'user.created',
  UPDATED: 'user.updated',
  FOLLOWED: 'user.followed',
  UNFOLLOWED: 'user.unfollowed',
  BLOCKED: 'user.blocked',
  UNBLOCKED: 'user.unblocked',
  STATUS_CHANGED: 'user.status_changed',
  VERIFIED: 'user.verified',
} as const;

// Pub/Sub topic
export const USER_TOPIC = 'user-events';
