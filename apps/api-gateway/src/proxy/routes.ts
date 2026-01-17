/**
 * Route Definitions
 * URL pattern -> Service mapping
 *
 * Format:
 * - Exact match: '/v1/auth/login'
 * - Parameter: '/v1/users/:id'
 * - Wildcard: '/v1/posts/*'
 */

export interface RouteDefinition {
  pattern: string;
  service: string;
  methods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
  rewrite?: string; // URL'i yeniden yaz
  stripPrefix?: boolean; // /v1 prefix'ini kaldır
  auth?: boolean; // Auth gerekli mi (default: true)
  rateLimit?: {
    limit: number;
    windowMs: number;
  };
}

/**
 * Route tanımları
 * Sıra önemli: Daha spesifik route'lar önce gelmeli
 */
export const ROUTES: RouteDefinition[] = [
  // ==================== AUTH ====================
  {
    pattern: '/v1/auth/login',
    service: 'auth',
    methods: ['POST'],
    auth: false,
    rateLimit: { limit: 5, windowMs: 60000 },
  },
  {
    pattern: '/v1/auth/register',
    service: 'auth',
    methods: ['POST'],
    auth: false,
    rateLimit: { limit: 3, windowMs: 60000 },
  },
  {
    pattern: '/v1/auth/refresh',
    service: 'auth',
    methods: ['POST'],
    auth: false,
  },
  {
    pattern: '/v1/auth/forgot-password',
    service: 'auth',
    methods: ['POST'],
    auth: false,
    rateLimit: { limit: 3, windowMs: 60000 },
  },
  {
    pattern: '/v1/auth/reset-password',
    service: 'auth',
    methods: ['POST'],
    auth: false,
  },
  {
    pattern: '/v1/auth/verify-email',
    service: 'auth',
    methods: ['POST'],
    auth: false,
  },
  {
    pattern: '/v1/auth/resend-verification',
    service: 'auth',
    methods: ['POST'],
    auth: true,
  },
  {
    pattern: '/v1/auth/oauth/google',
    service: 'auth',
    methods: ['POST'],
    auth: false,
  },
  {
    pattern: '/v1/auth/oauth/apple',
    service: 'auth',
    methods: ['POST'],
    auth: false,
  },
  {
    pattern: '/v1/auth/logout',
    service: 'auth',
    methods: ['POST'],
    auth: true,
  },
  {
    pattern: '/v1/auth/logout-all',
    service: 'auth',
    methods: ['POST'],
    auth: true,
  },
  {
    pattern: '/v1/auth/*',
    service: 'auth',
  },

  // ==================== USER ====================
  {
    pattern: '/v1/users/me',
    service: 'user',
    auth: true,
  },
  {
    pattern: '/v1/users/me/settings',
    service: 'user',
    auth: true,
  },
  {
    pattern: '/v1/users/me/keys',
    service: 'user',
    auth: true,
  },
  {
    pattern: '/v1/users/username/:username',
    service: 'user',
    methods: ['GET'],
    auth: false, // Public profil
  },
  {
    pattern: '/v1/users/blocked',
    service: 'user',
    auth: true,
  },
  {
    pattern: '/v1/users/search',
    service: 'user',
    methods: ['GET'],
    auth: true,
  },
  {
    pattern: '/v1/users/:id/follow',
    service: 'user',
    auth: true,
  },
  {
    pattern: '/v1/users/:id/block',
    service: 'user',
    auth: true,
  },
  {
    pattern: '/v1/users/:id/followers',
    service: 'user',
    methods: ['GET'],
  },
  {
    pattern: '/v1/users/:id/following',
    service: 'user',
    methods: ['GET'],
  },
  {
    pattern: '/v1/users/:id/keys',
    service: 'user',
    methods: ['GET'],
    auth: true,
  },
  {
    pattern: '/v1/users/:id',
    service: 'user',
    methods: ['GET'],
    auth: false, // Public profil
  },
  {
    pattern: '/v1/users/*',
    service: 'user',
  },

  // ==================== POST ====================
  {
    pattern: '/v1/posts/:id/poll/vote',
    service: 'post',
    methods: ['POST'],
    auth: true,
  },
  {
    pattern: '/v1/posts/:id',
    service: 'post',
    methods: ['GET'],
    auth: false, // Public post
  },
  {
    pattern: '/v1/posts/:id',
    service: 'post',
    methods: ['PATCH', 'DELETE'],
    auth: true,
  },
  {
    pattern: '/v1/posts',
    service: 'post',
    methods: ['POST'],
    auth: true,
    rateLimit: { limit: 30, windowMs: 60000 },
  },
  {
    pattern: '/v1/posts',
    service: 'post',
    methods: ['GET'],
  },

  // ==================== INTERACTION ====================
  {
    pattern: '/v1/posts/:id/like',
    service: 'interaction',
    auth: true,
  },
  {
    pattern: '/v1/posts/:id/dislike',
    service: 'interaction',
    auth: true,
  },
  {
    pattern: '/v1/posts/:id/repost',
    service: 'interaction',
    auth: true,
  },
  {
    pattern: '/v1/posts/:id/bookmark',
    service: 'interaction',
    auth: true,
  },
  {
    pattern: '/v1/posts/:id/comments',
    service: 'interaction',
  },
  {
    pattern: '/v1/comments/:id/like',
    service: 'interaction',
    auth: true,
  },
  {
    pattern: '/v1/comments/:id',
    service: 'interaction',
    auth: true,
  },
  {
    pattern: '/v1/bookmarks',
    service: 'interaction',
    auth: true,
  },

  // ==================== FEED ====================
  {
    pattern: '/v1/feed/home',
    service: 'feed',
    auth: true,
  },
  {
    pattern: '/v1/feed/explore',
    service: 'feed',
    auth: false,
  },
  {
    pattern: '/v1/feed/user/:userId',
    service: 'feed',
  },
  {
    pattern: '/v1/feed/hashtag/:tag',
    service: 'feed',
  },
  {
    pattern: '/v1/trending',
    service: 'feed',
    auth: false,
  },

  // ==================== MEDIA ====================
  {
    pattern: '/v1/media/upload',
    service: 'media',
    methods: ['POST'],
    auth: true,
    rateLimit: { limit: 20, windowMs: 60000 },
  },
  {
    pattern: '/v1/media/:id',
    service: 'media',
    auth: true,
  },

  // ==================== MESSAGE ====================
  {
    pattern: '/v1/conversations/:id/messages',
    service: 'message',
    auth: true,
  },
  {
    pattern: '/v1/conversations/:id/read',
    service: 'message',
    methods: ['POST'],
    auth: true,
  },
  {
    pattern: '/v1/conversations/:id',
    service: 'message',
    auth: true,
  },
  {
    pattern: '/v1/conversations',
    service: 'message',
    auth: true,
  },
  {
    pattern: '/v1/messages/settings',
    service: 'message',
    auth: true,
  },

  // ==================== NOTIFICATION ====================
  {
    pattern: '/v1/notifications/unread-count',
    service: 'notification',
    auth: true,
  },
  {
    pattern: '/v1/notifications/read-all',
    service: 'notification',
    methods: ['POST'],
    auth: true,
  },
  {
    pattern: '/v1/notifications/settings',
    service: 'notification',
    auth: true,
  },
  {
    pattern: '/v1/notifications/:id/read',
    service: 'notification',
    methods: ['PATCH'],
    auth: true,
  },
  {
    pattern: '/v1/notifications',
    service: 'notification',
    auth: true,
  },

  // ==================== LISTING (Faz 2) ====================
  {
    pattern: '/v1/listings/categories',
    service: 'listing',
    methods: ['GET'],
    auth: false,
  },
  {
    pattern: '/v1/listings/favorites',
    service: 'listing',
    auth: true,
  },
  {
    pattern: '/v1/listings/:id/favorite',
    service: 'listing',
    auth: true,
  },
  {
    pattern: '/v1/listings/:id/contact',
    service: 'listing',
    methods: ['POST'],
    auth: true,
  },
  {
    pattern: '/v1/listings/:id',
    service: 'listing',
  },
  {
    pattern: '/v1/listings',
    service: 'listing',
  },

  // ==================== DATING (Faz 3) ====================
  {
    pattern: '/v1/dating/profile',
    service: 'dating',
    auth: true,
  },
  {
    pattern: '/v1/dating/discover',
    service: 'dating',
    auth: true,
  },
  {
    pattern: '/v1/dating/swipe',
    service: 'dating',
    methods: ['POST'],
    auth: true,
  },
  {
    pattern: '/v1/dating/matches/:id',
    service: 'dating',
    auth: true,
  },
  {
    pattern: '/v1/dating/matches',
    service: 'dating',
    auth: true,
  },
  {
    pattern: '/v1/dating/likes',
    service: 'dating',
    auth: true,
  },

  // ==================== ADMIN ====================
  {
    pattern: '/v1/admin/*',
    service: 'admin',
    auth: true, // Admin auth ayrı kontrol edilir
  },

  // ==================== CONFIG ====================
  {
    pattern: '/v1/config',
    service: 'admin',
    methods: ['GET'],
    auth: false,
  },
];

/**
 * Route pattern matcher
 * URL'i pattern ile eşleştirir
 */
export function matchRoute(
  url: string,
  method: string,
): RouteDefinition | null {
  for (const route of ROUTES) {
    // Method kontrolü
    if (route.methods && !route.methods.includes(method as any)) {
      continue;
    }

    // Pattern eşleşme
    if (matchPattern(url, route.pattern)) {
      return route;
    }
  }

  return null;
}

/**
 * Pattern matching helper
 */
function matchPattern(url: string, pattern: string): boolean {
  // Wildcard pattern
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    return url.startsWith(prefix);
  }

  // Exact match veya parameter match
  const urlParts = url.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (urlParts.length !== patternParts.length) {
    return false;
  }

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const urlPart = urlParts[i];

    // Parameter (örn: :id)
    if (patternPart.startsWith(':')) {
      continue;
    }

    // Exact match
    if (patternPart !== urlPart) {
      return false;
    }
  }

  return true;
}

/**
 * URL'den parametre çıkar
 */
export function extractParams(
  url: string,
  pattern: string,
): Record<string, string> {
  const params: Record<string, string> = {};
  const urlParts = url.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = urlParts[i];
    }
  }

  return params;
}
