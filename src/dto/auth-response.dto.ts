/**
 * Kullanıcı Bilgileri (Public)
 *
 * passwordHash gibi hassas alanlar hariç tutulur.
 */
export interface UserResponse {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  isPrivate: boolean;
  isVerified: boolean;
  stats: UserStats;
  subscription: Subscription;
  verification: VerificationStatus;
  modules: UserModules;
  createdAt: string;
}

export interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesCount: number;
}

export interface Subscription {
  plan: 'free' | 'premium' | 'business';
  expiresAt?: string;
  subscribedAt?: string;
}

export interface VerificationStatus {
  email: boolean;
  phone: boolean;
  identity: boolean;
}

export interface UserModules {
  dating: boolean;
  listings: boolean;
}

/**
 * Auth Response DTO
 *
 * Login ve Register endpoint'lerinin ortak yanıt formatı.
 * API Contract'a uygun (04-api-contracts.md)
 */
export class AuthResponseDto {
  /**
   * Kullanıcı bilgileri (passwordHash hariç)
   */
  user: UserResponse;

  /**
   * Access Token (JWT)
   *
   * - Kısa ömürlü (15 dakika)
   * - API isteklerinde Authorization header'ında kullanılır
   * - RS256 algoritması ile imzalanır
   */
  accessToken: string;

  /**
   * Refresh Token
   *
   * - Uzun ömürlü (7 gün)
   * - Yeni access token almak için kullanılır
   * - Secure storage'da saklanmalı
   */
  refreshToken: string;

  /**
   * Access Token'ın geçerlilik süresi (saniye)
   *
   * Default: 900 (15 dakika)
   */
  expiresIn: number;
}

/**
 * Token Refresh Response
 *
 * /auth/refresh endpoint yanıtı
 */
export class TokenRefreshResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
