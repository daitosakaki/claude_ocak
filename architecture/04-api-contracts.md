# API Contracts

## Base Info

| Property | Value |
|----------|-------|
| Base URL (Prod) | `https://api.superapp.com/v1` |
| Base URL (Staging) | `https://api-staging.superapp.com/v1` |
| Protocol | HTTPS |
| Format | JSON |
| Auth | Bearer Token |

---

## Common Headers

### Request Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
X-Device-Id: <uuid>
X-Platform: ios | android | web
X-App-Version: 1.0.0
X-Request-Id: <uuid>
Accept-Language: tr | en
```

### Response Headers

```
X-Request-Id: <uuid>
X-Response-Time: 45ms
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 95
X-Rate-Limit-Reset: 1642000000
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example"
  }
}
```

### Success with Pagination

```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasMore": true,
    "nextCursor": "eyJpZCI6IjEyMyJ9"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with this ID was not found",
    "details": {
      "field": "userId",
      "value": "invalid-id"
    }
  }
}
```

### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| TOKEN_EXPIRED | 401 | Access token expired |
| TOKEN_INVALID | 401 | Invalid token format |
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | No permission |
| NOT_FOUND | 404 | Resource not found |
| USER_NOT_FOUND | 404 | User doesn't exist |
| POST_NOT_FOUND | 404 | Post doesn't exist |
| ALREADY_EXISTS | 409 | Resource already exists |
| USERNAME_TAKEN | 409 | Username already in use |
| EMAIL_TAKEN | 409 | Email already in use |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

---

## AUTH SERVICE

### Register

```
POST /auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "displayName": "John Doe"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "username": "johndoe",
      "displayName": "John Doe",
      "email": "user@example.com",
      "avatar": null,
      "isVerified": false,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "expiresIn": 900
  }
}
```

---

### Login

```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "deviceId": "device_uuid_123",
  "deviceName": "iPhone 15 Pro",
  "platform": "ios"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "expiresIn": 900
  }
}
```

---

### OAuth Login

```
POST /auth/oauth/google
POST /auth/oauth/apple
```

**Request:**
```json
{
  "idToken": "google_or_apple_id_token",
  "deviceId": "device_uuid_123",
  "deviceName": "iPhone 15 Pro",
  "platform": "ios"
}
```

**Response 200:** Same as login

---

### Refresh Token

```
POST /auth/refresh
```

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token...",
    "refreshToken": "new_refresh_token...",
    "expiresIn": 900
  }
}
```

---

### Logout

```
POST /auth/logout
```

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response 200:**
```json
{
  "success": true
}
```

---

### Logout All Devices

```
POST /auth/logout-all
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "sessionsRevoked": 3
  }
}
```

---

### Forgot Password

```
POST /auth/forgot-password
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### Reset Password

```
POST /auth/reset-password
```

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

### Verify Email

```
POST /auth/verify-email
```

**Request:**
```json
{
  "token": "verification_token_from_email"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### Resend Verification Email

```
POST /auth/resend-verification
```

**Response 200:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

---

## USER SERVICE

### Get Current User

```
GET /users/me
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "johndoe",
    "displayName": "John Doe",
    "email": "user@example.com",
    "phone": "+90555...",
    "avatar": "https://cdn.../avatar.jpg",
    "coverImage": "https://cdn.../cover.jpg",
    "bio": "Hello world",
    "website": "https://example.com",
    "isPrivate": false,
    "isVerified": true,
    "stats": {
      "postsCount": 42,
      "followersCount": 1234,
      "followingCount": 567
    },
    "subscription": {
      "plan": "premium",
      "expiresAt": "2025-01-15T00:00:00Z"
    },
    "verification": {
      "email": true,
      "phone": true,
      "identity": true
    },
    "modules": {
      "dating": true,
      "listings": false
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### Get User by ID

```
GET /users/:id
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "user_456",
    "username": "janedoe",
    "displayName": "Jane Doe",
    "avatar": "https://cdn.../avatar.jpg",
    "bio": "Designer",
    "isPrivate": false,
    "isVerified": true,
    "stats": {
      "postsCount": 100,
      "followersCount": 5000,
      "followingCount": 200
    },
    "isFollowing": true,
    "isFollowedBy": false,
    "isBlocked": false,
    "createdAt": "2023-06-01T00:00:00Z"
  }
}
```

---

### Get User by Username

```
GET /users/username/:username
```

**Response:** Same as Get User by ID

---

### Update Profile

```
PATCH /users/me
```

**Request:**
```json
{
  "displayName": "John D.",
  "bio": "Updated bio",
  "website": "https://newsite.com",
  "avatar": "https://cdn.../new-avatar.jpg"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Get User Settings

```
GET /users/me/settings
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "privacy": {
      "whoCanDM": "everyone",
      "whoCanTag": "followers",
      "whoCanSeeFollowers": "everyone",
      "hideFromSearch": false,
      "twoFactorEnabled": true
    },
    "content": {
      "sensitiveContentFilter": true,
      "mutedWords": ["spam", "ad"],
      "autoPlayVideos": "wifi"
    },
    "display": {
      "theme": "dark",
      "language": "tr",
      "dataSaver": false
    }
  }
}
```

---

### Update Settings

```
PATCH /users/me/settings
```

**Request:**
```json
{
  "privacy": {
    "whoCanDM": "followers"
  },
  "display": {
    "theme": "dark"
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Get Followers

```
GET /users/:id/followers
```

**Query:** `?cursor=xxx&limit=20`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_789",
      "username": "follower1",
      "displayName": "Follower One",
      "avatar": "...",
      "isFollowing": true,
      "isFollowedBy": true
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "xxx"
  }
}
```

---

### Get Following

```
GET /users/:id/following
```

**Query:** `?cursor=xxx&limit=20`

**Response:** Same structure as followers

---

### Follow User

```
POST /users/:id/follow
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "status": "following"
  }
}
```

**Response 200 (Private account):**
```json
{
  "success": true,
  "data": {
    "status": "pending"
  }
}
```

---

### Unfollow User

```
DELETE /users/:id/follow
```

**Response 200:**
```json
{
  "success": true
}
```

---

### Block User

```
POST /users/:id/block
```

**Response 200:**
```json
{
  "success": true
}
```

---

### Unblock User

```
DELETE /users/:id/block
```

**Response 200:**
```json
{
  "success": true
}
```

---

### Get Blocked Users

```
GET /users/blocked
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_blocked",
      "username": "blockeduser",
      "displayName": "Blocked User",
      "avatar": "...",
      "blockedAt": "2024-01-10T00:00:00Z"
    }
  ]
}
```

---

### Search Users

```
GET /users/search
```

**Query:** `?q=john&limit=20`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatar": "...",
      "isVerified": true,
      "isFollowing": false
    }
  ]
}
```

---

### Upload/Update Public Key (E2EE)

```
POST /users/me/keys
```

**Request:**
```json
{
  "publicKey": "base64_encoded_x25519_public_key",
  "deviceId": "device_uuid",
  "deviceName": "iPhone 15 Pro"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "key_123",
    "deviceId": "device_uuid",
    "createdAt": "2024-01-15T00:00:00Z"
  }
}
```

---

### Get User Public Keys

```
GET /users/:id/keys
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "publicKey": "base64_encoded_key",
      "deviceId": "device_uuid",
      "deviceName": "iPhone 15 Pro",
      "isActive": true
    }
  ]
}
```

---

## POST SERVICE

### Get Posts (Feed)

```
GET /posts
```

**Query:** `?cursor=xxx&limit=20&authorId=xxx`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "post_123",
      "author": {
        "id": "user_456",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatar": "..."
      },
      "type": "image",
      "content": {
        "text": "Beautiful sunset! #photography",
        "media": [
          {
            "type": "image",
            "url": "https://cdn.../image.jpg",
            "thumbnailUrl": "https://cdn.../thumb.jpg",
            "width": 1080,
            "height": 720,
            "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
          }
        ]
      },
      "visibility": "public",
      "stats": {
        "likesCount": 42,
        "dislikesCount": 2,
        "commentsCount": 5,
        "repostsCount": 3,
        "viewsCount": 500
      },
      "hashtags": ["photography"],
      "isLiked": true,
      "isDisliked": false,
      "isReposted": false,
      "isBookmarked": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "xxx"
  }
}
```

---

### Get Post by ID

```
GET /posts/:id
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "post_123",
    "author": { ... },
    "type": "poll",
    "content": {
      "text": "What's your favorite color?",
      "poll": {
        "question": "What's your favorite color?",
        "options": [
          { "id": "opt_1", "text": "Red", "votesCount": 10, "percentage": 25 },
          { "id": "opt_2", "text": "Blue", "votesCount": 20, "percentage": 50 },
          { "id": "opt_3", "text": "Green", "votesCount": 10, "percentage": 25 }
        ],
        "totalVotes": 40,
        "endsAt": "2024-01-20T00:00:00Z",
        "hasVoted": true,
        "myVote": "opt_2"
      }
    },
    ...
  }
}
```

---

### Create Post

```
POST /posts
```

**Request (Text):**
```json
{
  "type": "text",
  "content": {
    "text": "Hello world! @janedoe #greeting"
  },
  "visibility": "public"
}
```

**Request (Image/Video):**
```json
{
  "type": "image",
  "content": {
    "text": "Check this out!",
    "mediaIds": ["media_123", "media_456"]
  },
  "visibility": "public"
}
```

**Request (Poll):**
```json
{
  "type": "poll",
  "content": {
    "text": "Quick poll",
    "poll": {
      "question": "What's your favorite?",
      "options": ["Option A", "Option B", "Option C"],
      "endsAt": "2024-01-20T00:00:00Z",
      "allowMultiple": false
    }
  },
  "visibility": "public"
}
```

**Request (Quote Repost):**
```json
{
  "type": "text",
  "content": {
    "text": "Great point!"
  },
  "quotePostId": "post_original_123",
  "visibility": "public"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "post_new_123",
    ...
  }
}
```

---

### Update Post

```
PATCH /posts/:id
```

**Request:**
```json
{
  "content": {
    "text": "Updated text"
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Delete Post

```
DELETE /posts/:id
```

**Response 200:**
```json
{
  "success": true
}
```

---

### Vote on Poll

```
POST /posts/:id/poll/vote
```

**Request:**
```json
{
  "optionId": "opt_2"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "poll": {
      "options": [
        { "id": "opt_1", "text": "Red", "votesCount": 10, "percentage": 24 },
        { "id": "opt_2", "text": "Blue", "votesCount": 21, "percentage": 51 },
        { "id": "opt_3", "text": "Green", "votesCount": 10, "percentage": 24 }
      ],
      "totalVotes": 41,
      "myVote": "opt_2"
    }
  }
}
```

---

## FEED SERVICE

### Get Home Feed

```
GET /feed/home
```

**Query:** `?cursor=xxx&limit=20`

**Response:** Same as GET /posts

---

### Get Explore Feed

```
GET /feed/explore
```

**Query:** `?cursor=xxx&limit=20`

**Response:** Same as GET /posts

---

### Get User Timeline

```
GET /feed/user/:userId
```

**Query:** `?cursor=xxx&limit=20`

**Response:** Same as GET /posts

---

### Get Hashtag Feed

```
GET /feed/hashtag/:tag
```

**Query:** `?cursor=xxx&limit=20`

**Response:** Same as GET /posts

---

### Get Trending

```
GET /trending
```

**Query:** `?region=TR&period=daily`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "hashtags": [
      {
        "tag": "teknoloji",
        "postsCount": 5420,
        "rank": 1
      },
      {
        "tag": "spor",
        "postsCount": 3210,
        "rank": 2
      }
    ],
    "period": "daily",
    "region": "TR",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## INTERACTION SERVICE

### Like Post

```
POST /posts/:id/like
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "likesCount": 43
  }
}
```

---

### Unlike Post

```
DELETE /posts/:id/like
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "likesCount": 42
  }
}
```

---

### Dislike Post

```
POST /posts/:id/dislike
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "dislikesCount": 3
  }
}
```

---

### Remove Dislike

```
DELETE /posts/:id/dislike
```

---

### Repost

```
POST /posts/:id/repost
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "repostId": "post_repost_123",
    "repostsCount": 4
  }
}
```

---

### Remove Repost

```
DELETE /posts/:id/repost
```

---

### Bookmark Post

```
POST /posts/:id/bookmark
```

**Request (optional):**
```json
{
  "folderId": "folder_123"
}
```

**Response 200:**
```json
{
  "success": true
}
```

---

### Remove Bookmark

```
DELETE /posts/:id/bookmark
```

---

### Get Bookmarks

```
GET /bookmarks
```

**Query:** `?cursor=xxx&limit=20&folderId=xxx`

**Response:** List of posts

---

### Get Comments

```
GET /posts/:id/comments
```

**Query:** `?cursor=xxx&limit=20&parentId=xxx`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comment_123",
      "author": {
        "id": "user_789",
        "username": "commenter",
        "displayName": "Commenter",
        "avatar": "..."
      },
      "content": "Great post!",
      "stats": {
        "likesCount": 5,
        "repliesCount": 2
      },
      "isLiked": false,
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "xxx"
  }
}
```

---

### Create Comment

```
POST /posts/:id/comments
```

**Request:**
```json
{
  "content": "Nice post! @johndoe",
  "parentId": null
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "comment_new_123",
    "content": "Nice post! @johndoe",
    "createdAt": "2024-01-15T11:30:00Z"
  }
}
```

---

### Delete Comment

```
DELETE /comments/:id
```

---

### Like Comment

```
POST /comments/:id/like
```

---

### Unlike Comment

```
DELETE /comments/:id/like
```

---

## MESSAGE SERVICE

### Get Conversations

```
GET /conversations
```

**Query:** `?cursor=xxx&limit=20&archived=false`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conv_123",
      "type": "direct",
      "participants": [
        {
          "id": "user_456",
          "username": "johndoe",
          "displayName": "John Doe",
          "avatar": "...",
          "isOnline": true
        }
      ],
      "lastMessage": {
        "id": "msg_789",
        "senderId": "user_456",
        "preview": "Hey, how are you?",
        "type": "text",
        "sentAt": "2024-01-15T10:30:00Z"
      },
      "unreadCount": 2,
      "isArchived": false,
      "isMuted": false,
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "xxx"
  }
}
```

---

### Create Conversation

```
POST /conversations
```

**Request:**
```json
{
  "participantIds": ["user_456"],
  "type": "direct"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "conv_new_123",
    "type": "direct",
    "participants": [ ... ],
    "createdAt": "2024-01-15T12:00:00Z"
  }
}
```

---

### Get Conversation

```
GET /conversations/:id
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "conv_123",
    "type": "direct",
    "participants": [ ... ],
    "lastMessage": { ... },
    "unreadCount": 0,
    "messagesCount": 150,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### Get Messages

```
GET /conversations/:id/messages
```

**Query:** `?cursor=xxx&limit=50`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_123",
      "senderId": "user_456",
      "type": "text",
      "encrypted": {
        "content": "base64_encrypted_content",
        "nonce": "base64_nonce",
        "algorithm": "x25519-aes256gcm"
      },
      "status": {
        "sent": "2024-01-15T10:30:00Z",
        "delivered": [
          { "userId": "user_me", "at": "2024-01-15T10:30:01Z" }
        ],
        "read": [
          { "userId": "user_me", "at": "2024-01-15T10:31:00Z" }
        ]
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "xxx"
  }
}
```

---

### Send Message (HTTP fallback)

```
POST /conversations/:id/messages
```

**Request:**
```json
{
  "type": "text",
  "encrypted": {
    "content": "base64_encrypted_content",
    "nonce": "base64_nonce",
    "algorithm": "x25519-aes256gcm"
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "msg_new_123",
    "sentAt": "2024-01-15T12:00:00Z"
  }
}
```

---

### Archive Conversation

```
PATCH /conversations/:id
```

**Request:**
```json
{
  "isArchived": true
}
```

---

### Mute Conversation

```
PATCH /conversations/:id
```

**Request:**
```json
{
  "isMuted": true,
  "mutedUntil": "2024-01-16T00:00:00Z"
}
```

---

### Mark as Read

```
POST /conversations/:id/read
```

**Request:**
```json
{
  "messageId": "msg_last_read"
}
```

---

### Get Messaging Settings

```
GET /messages/settings
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "showOnlineStatus": true,
    "showLastSeen": true,
    "showTypingIndicator": true,
    "showReadReceipts": true,
    "mediaAutoDownload": "wifi",
    "autoDeleteMessages": "off"
  }
}
```

---

### Update Messaging Settings

```
PATCH /messages/settings
```

**Request:**
```json
{
  "showOnlineStatus": false
}
```

---

## NOTIFICATION SERVICE

### Get Notifications

```
GET /notifications
```

**Query:** `?cursor=xxx&limit=20&type=xxx`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "type": "like",
      "actor": {
        "id": "user_456",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatar": "..."
      },
      "target": {
        "type": "post",
        "id": "post_789"
      },
      "content": {
        "title": "New like",
        "body": "John Doe liked your post"
      },
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "xxx"
  }
}
```

---

### Get Unread Count

```
GET /notifications/unread-count
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### Mark as Read

```
PATCH /notifications/:id/read
```

---

### Mark All as Read

```
POST /notifications/read-all
```

---

### Get Notification Settings

```
GET /notifications/settings
```

---

### Update Notification Settings

```
PATCH /notifications/settings
```

---

## MEDIA SERVICE

### Upload Media

```
POST /media/upload
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Binary file
- `type`: `image` | `video` | `voice`

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "media_123",
    "url": "https://cdn.../image.jpg",
    "thumbnailUrl": "https://cdn.../thumb.jpg",
    "type": "image",
    "mimeType": "image/jpeg",
    "size": 245678,
    "width": 1080,
    "height": 720,
    "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
  }
}
```

---

### Delete Media

```
DELETE /media/:id
```

---

## CONFIG

### Get App Config

```
GET /config
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "features": {
      "msg_typing_indicator": true,
      "msg_online_status": true,
      "msg_voice_messages": false,
      "msg_video_calls": false,
      "social_stories": false,
      "social_polls": true,
      "dating_module": false,
      "listing_module": false
    },
    "premiumFeatures": [
      "msg_voice_messages",
      "msg_auto_delete",
      "social_scheduled_posts",
      "dating_unlimited_likes",
      "dating_see_who_liked"
    ],
    "app": {
      "minVersion": "1.0.0",
      "currentVersion": "1.2.0",
      "maintenanceMode": false,
      "maintenanceMessage": null
    },
    "limits": {
      "maxPostLength": 2000,
      "maxMediaPerPost": 5,
      "maxBioLength": 500
    }
  }
}
```

---

## LISTING SERVICE (Faz 2)

### Get Listings

```
GET /listings
```

**Query:** `?category=vehicles/cars&city=istanbul&minPrice=100000&maxPrice=500000&cursor=xxx`

---

### Get Listing

```
GET /listings/:id
```

---

### Create Listing

```
POST /listings
```

---

### Update Listing

```
PATCH /listings/:id
```

---

### Delete Listing

```
DELETE /listings/:id
```

---

### Get Categories

```
GET /listings/categories
```

---

### Favorite Listing

```
POST /listings/:id/favorite
```

---

### Unfavorite Listing

```
DELETE /listings/:id/favorite
```

---

### Get Favorites

```
GET /listings/favorites
```

---

### Contact Seller

```
POST /listings/:id/contact
```

Creates conversation with seller.

---

## DATING SERVICE (Faz 3)

### Get Dating Profile

```
GET /dating/profile
```

---

### Create/Update Dating Profile

```
PUT /dating/profile
```

---

### Delete Dating Profile

```
DELETE /dating/profile
```

---

### Get Discover

```
GET /dating/discover
```

**Query:** `?limit=10`

---

### Swipe

```
POST /dating/swipe
```

**Request:**
```json
{
  "targetId": "user_456",
  "action": "like"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "match": true,
    "matchId": "match_123",
    "conversationId": "conv_456"
  }
}
```

---

### Get Matches

```
GET /dating/matches
```

---

### Unmatch

```
DELETE /dating/matches/:id
```

---

### Get Likes Received (Premium)

```
GET /dating/likes
```

---

## ADMIN SERVICE

### Admin Login

```
POST /admin/auth/login
```

---

### Get Dashboard Stats

```
GET /admin/dashboard/stats
```

---

### Get Users

```
GET /admin/users
```

---

### Get User

```
GET /admin/users/:id
```

---

### Update User

```
PATCH /admin/users/:id
```

---

### Ban User

```
POST /admin/users/:id/ban
```

---

### Suspend User

```
POST /admin/users/:id/suspend
```

---

### Get Reports

```
GET /admin/reports
```

---

### Resolve Report

```
PATCH /admin/reports/:id
```

---

### Get Feature Flags

```
GET /admin/feature-flags
```

---

### Update Feature Flag

```
PATCH /admin/feature-flags/:key
```

---

### Get Admin Logs

```
GET /admin/logs
```
