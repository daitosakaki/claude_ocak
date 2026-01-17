/**
 * API Response DTO
 * Standart API response formatları
 */

// Başarılı response
export interface ApiResponse<T> {
  success: true;
  data?: T;
  message?: string;
}

// Hata response
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Pagination bilgisi
export interface PaginationInfo {
  total?: number;
  page?: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationInfo;
}

// Error kodları
export const ErrorCodes = {
  // Auth
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_DATA: 'INVALID_DATA',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // Permissions
  FORBIDDEN: 'FORBIDDEN',
  NOT_PARTICIPANT: 'NOT_PARTICIPANT',
  USER_BLOCKED: 'USER_BLOCKED',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // Content
  MESSAGE_TOO_LARGE: 'MESSAGE_TOO_LARGE',
  MEDIA_INVALID: 'MEDIA_INVALID',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
