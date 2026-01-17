# Database Schema (MongoDB)

## Collection Haritası

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONGODB COLLECTIONS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CORE                          SOCIAL                            │
│  ├── users                     ├── posts                        │
│  ├── user_settings             ├── comments                     │
│  ├── user_keys                 ├── interactions                 │
│  └── sessions                  ├── follows                      │
│                                ├── bookmarks                    │
│  MESSAGING                     └── hashtags                     │
│  ├── conversations                                               │
│  ├── messages                  LISTINGS (Faz 2)                 │
│  └── messaging_settings        ├── listings                     │
│                                ├── listing_categories           │
│  DATING (Faz 3)                ├── listing_favorites            │
│  ├── dating_profiles           └── listing_settings             │
│  ├── swipes                                                      │
│  └── matches                   SYSTEM                            │
│                                ├── notifications                │
│  ADMIN                         ├── notification_settings        │
│  ├── admin_users               ├── reports                      │
│  └── admin_logs                ├── feature_flags                │
│                                └── trends                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## CORE COLLECTIONS

### users

Ana kullanıcı collection'ı. Sık erişilen veriler burada.

```javascript
{
  _id: ObjectId,
  
  // ========== IDENTITY ==========
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    minLength: 3,
    maxLength: 20,
    match: /^[a-z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true  // null olabilir
  },
  passwordHash: {
    type: String,
    required: true,
    select: false  // varsayılan olarak dönme
  },
  
  // ========== PROFILE (Public) ==========
  displayName: {
    type: String,
    required: true,
    maxLength: 50
  },
  avatar: String,      // URL
  coverImage: String,  // URL
  bio: {
    type: String,
    maxLength: 500
  },
  website: String,
  birthDate: {
    type: Date,
    select: false  // gizli
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  
  // ========== FLAGS (Sık erişilen) ==========
  isPrivate: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // ========== STATS (Denormalized) ==========
  stats: {
    postsCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 }
  },
  
  // ========== SUBSCRIPTION ==========
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'business'],
      default: 'free'
    },
    expiresAt: Date,
    subscribedAt: Date
  },
  
  // ========== STATUS ==========
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'deleted'],
    default: 'active'
  },
  banReason: String,
  suspendedUntil: Date,
  lastSeenAt: Date,
  
  // ========== AUTH ==========
  oauth: {
    google: String,   // Google user ID
    apple: String     // Apple user ID
  },
  
  // ========== VERIFICATION ==========
  verification: {
    email: { type: Boolean, default: false },
    phone: { type: Boolean, default: false },
    identity: { type: Boolean, default: false }  // mavi tik
  },
  
  // ========== DEVICES ==========
  fcmTokens: [{
    token: String,
    deviceId: String,
    platform: {
      type: String,
      enum: ['ios', 'android', 'web']
    },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // ========== MODULES ==========
  modules: {
    dating: { type: Boolean, default: false },
    listings: { type: Boolean, default: false }
  },
  
  // ========== TIMESTAMPS ==========
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ username: 1 }                          // unique
{ email: 1 }                             // unique
{ phone: 1 }                             // unique, sparse
{ "oauth.google": 1 }                    // sparse
{ "oauth.apple": 1 }                     // sparse
{ status: 1, createdAt: -1 }             // admin listing
{ displayName: "text", username: "text" } // search
```

---

### user_settings

Kullanıcı ayarları. Sadece ayarlar sayfasında ve özel durumlarda erişilir.

```javascript
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // ========== PRIVACY ==========
  privacy: {
    whoCanDM: {
      type: String,
      enum: ['everyone', 'followers', 'none'],
      default: 'everyone'
    },
    whoCanTag: {
      type: String,
      enum: ['everyone', 'followers', 'none'],
      default: 'everyone'
    },
    whoCanSeeFollowers: {
      type: String,
      enum: ['everyone', 'followers', 'none'],
      default: 'everyone'
    },
    hideFromSearch: { type: Boolean, default: false },
    hideFromContacts: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false }
  },
  
  // ========== CONTENT ==========
  content: {
    sensitiveContentFilter: { type: Boolean, default: true },
    mutedWords: [String],
    contentLanguages: [String],  // ['tr', 'en']
    autoPlayVideos: {
      type: String,
      enum: ['always', 'wifi', 'never'],
      default: 'wifi'
    }
  },
  
  // ========== DISPLAY ==========
  display: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'tr'
    },
    dataSaver: { type: Boolean, default: false },
    reduceMotion: { type: Boolean, default: false },
    hapticFeedback: { type: Boolean, default: true }
  },
  
  // ========== LOCATION ==========
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],  // [longitude, latitude]
    city: String,
    country: String,
    updatedAt: Date
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ userId: 1 }  // unique
```

---

### user_keys

E2EE için public key'ler. Multi-device destekli.

```javascript
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  publicKey: {
    type: String,
    required: true  // Base64 encoded X25519 public key
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceName: String,  // "iPhone 15", "Chrome - Windows"
  platform: {
    type: String,
    enum: ['ios', 'android', 'web']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsedAt: Date,
  createdAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ userId: 1 }
{ userId: 1, deviceId: 1 }  // unique
{ userId: 1, isActive: 1 }
```

---

### sessions

Aktif refresh token'lar.

```javascript
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  refreshToken: {
    type: String,
    required: true,
    unique: true
  },
  deviceId: String,
  deviceName: String,
  platform: {
    type: String,
    enum: ['ios', 'android', 'web']
  },
  ip: String,
  userAgent: String,
  lastUsedAt: Date,
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ refreshToken: 1 }          // unique
{ userId: 1 }
{ expiresAt: 1 }             // TTL index
```

---

## SOCIAL COLLECTIONS

### posts

```javascript
{
  _id: ObjectId,
  authorId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  
  // ========== TYPE ==========
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'poll'],
    required: true
  },
  
  // ========== CONTENT ==========
  content: {
    text: {
      type: String,
      maxLength: 2000
    },
    media: [{
      type: {
        type: String,
        enum: ['image', 'video']
      },
      url: String,
      thumbnailUrl: String,
      width: Number,
      height: Number,
      duration: Number,  // video: saniye
      blurhash: String
    }],
    poll: {
      question: {
        type: String,
        maxLength: 200
      },
      options: [{
        id: String,
        text: {
          type: String,
          maxLength: 100
        },
        votesCount: { type: Number, default: 0 }
      }],
      totalVotes: { type: Number, default: 0 },
      endsAt: Date,
      allowMultiple: { type: Boolean, default: false }
    }
  },
  
  // ========== VISIBILITY ==========
  visibility: {
    type: String,
    enum: ['public', 'private', 'followers'],
    default: 'public'
  },
  
  // ========== STATS (Denormalized) ==========
  stats: {
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    repostsCount: { type: Number, default: 0 },
    quotesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    bookmarksCount: { type: Number, default: 0 }
  },
  
  // ========== REPOST ==========
  repost: {
    isRepost: { type: Boolean, default: false },
    originalPostId: { type: ObjectId, ref: 'Post' },
    originalAuthorId: { type: ObjectId, ref: 'User' },
    isQuote: { type: Boolean, default: false }  // alıntı mı?
  },
  
  // ========== EXTRACTED ==========
  hashtags: [String],     // lowercase, # olmadan
  mentions: [ObjectId],   // user IDs
  
  // ========== LOCATION ==========
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number],
    name: String  // "İstanbul, Türkiye"
  },
  
  // ========== FLAGS ==========
  isPinned: { type: Boolean, default: false },
  commentsDisabled: { type: Boolean, default: false },
  
  // ========== STATUS ==========
  status: {
    type: String,
    enum: ['active', 'deleted', 'hidden'],
    default: 'active'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ authorId: 1, createdAt: -1 }           // user timeline
{ authorId: 1, isPinned: -1, createdAt: -1 }  // profile (pinned first)
{ hashtags: 1, createdAt: -1 }           // hashtag feed
{ createdAt: -1 }                        // explore
{ status: 1, visibility: 1, createdAt: -1 }
{ "stats.likesCount": -1, createdAt: -1 } // trending
{ location: "2dsphere" }                  // nearby posts
{ "content.text": "text" }               // search
```

---

### comments

Threaded yorumlar.

```javascript
{
  _id: ObjectId,
  postId: {
    type: ObjectId,
    ref: 'Post',
    required: true
  },
  authorId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  parentId: {
    type: ObjectId,
    ref: 'Comment',
    default: null  // null = root comment
  },
  
  content: {
    type: String,
    required: true,
    maxLength: 500
  },
  mentions: [ObjectId],
  
  stats: {
    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 }
  },
  
  status: {
    type: String,
    enum: ['active', 'deleted', 'hidden'],
    default: 'active'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ postId: 1, createdAt: -1 }           // post comments
{ postId: 1, parentId: 1, createdAt: 1 }  // threaded
{ authorId: 1, createdAt: -1 }
{ parentId: 1 }
```

---

### interactions

Like, dislike, repost, poll vote.

```javascript
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['post', 'comment'],
    required: true
  },
  targetId: {
    type: ObjectId,
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'dislike', 'repost', 'poll_vote'],
    required: true
  },
  
  // Poll vote için
  pollOptionId: String,
  
  createdAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ userId: 1, targetType: 1, targetId: 1, type: 1 }  // unique compound
{ targetId: 1, type: 1 }                            // target'ın etkileşimleri
{ userId: 1, type: 1, createdAt: -1 }               // user'ın etkileşimleri
```

---

### follows

```javascript
{
  _id: ObjectId,
  followerId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  followingId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'pending'],  // pending = private hesap onay bekliyor
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ followerId: 1, followingId: 1 }   // unique compound
{ followerId: 1, status: 1 }        // takip ettiklerim
{ followingId: 1, status: 1 }       // takipçilerim
{ followingId: 1, status: 1, createdAt: -1 }  // yeni takipçiler
```

---

### bookmarks

```javascript
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: ObjectId,
    ref: 'Post',
    required: true
  },
  folderId: {
    type: ObjectId,
    ref: 'BookmarkFolder',
    default: null  // null = genel
  },
  createdAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ userId: 1, postId: 1 }        // unique compound
{ userId: 1, createdAt: -1 }    // kaydettiklerim
{ userId: 1, folderId: 1, createdAt: -1 }  // klasör içi
```

---

### hashtags

Trend hesaplama için.

```javascript
{
  _id: ObjectId,
  tag: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  stats: {
    postsCount: { type: Number, default: 0 },
    postsToday: { type: Number, default: 0 },
    postsThisWeek: { type: Number, default: 0 }
  },
  lastUsedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ tag: 1 }                      // unique
{ "stats.postsToday": -1 }      // trending today
{ "stats.postsThisWeek": -1 }   // trending week
```

---

## MESSAGING COLLECTIONS

### conversations

```javascript
{
  _id: ObjectId,
  type: {
    type: String,
    enum: ['direct', 'group', 'listing', 'dating'],
    default: 'direct'
  },
  
  participants: [{
    userId: {
      type: ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    },
    joinedAt: { type: Date, default: Date.now },
    lastReadAt: Date,
    lastReadMessageId: ObjectId,
    unreadCount: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    mutedUntil: Date,
    isDeleted: { type: Boolean, default: false }  // soft delete for this user
  }],
  
  // Group chat
  group: {
    name: { type: String, maxLength: 100 },
    avatar: String,
    description: { type: String, maxLength: 500 }
  },
  
  // İlişkili kayıt
  relatedTo: {
    type: {
      type: String,
      enum: ['listing', 'match']
    },
    id: ObjectId
  },
  
  // Son mesaj (denormalized)
  lastMessage: {
    messageId: ObjectId,
    senderId: ObjectId,
    preview: String,    // "Fotoğraf", "Sesli mesaj" veya ilk 50 karakter
    type: String,
    sentAt: Date
  },
  
  messagesCount: { type: Number, default: 0 },
  
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ "participants.userId": 1, updatedAt: -1 }  // user'ın sohbetleri
{ "participants.userId": 1, "participants.isDeleted": 1, updatedAt: -1 }
{ "relatedTo.type": 1, "relatedTo.id": 1 }
```

---

### messages

E2EE şifreli mesajlar.

```javascript
{
  _id: ObjectId,
  conversationId: {
    type: ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'voice', 'file', 'system'],
    default: 'text'
  },
  
  // E2EE encrypted content
  encrypted: {
    content: {
      type: String,
      required: true  // Base64 encrypted message
    },
    nonce: {
      type: String,
      required: true  // Base64 nonce
    },
    algorithm: {
      type: String,
      default: 'x25519-aes256gcm'
    }
  },
  
  // Media (URL'ler şifresiz, içerik şifreli)
  media: {
    url: String,
    thumbnailUrl: String,
    mimeType: String,
    size: Number,       // bytes
    width: Number,
    height: Number,
    duration: Number,   // ses/video: saniye
    fileName: String
  },
  
  // Reply
  replyTo: {
    type: ObjectId,
    ref: 'Message'
  },
  
  // Status tracking
  status: {
    sent: { type: Date, default: Date.now },
    delivered: [{
      userId: ObjectId,
      at: Date
    }],
    read: [{
      userId: ObjectId,
      at: Date
    }]
  },
  
  // Soft delete per user
  deletedFor: [ObjectId],
  
  // System message
  systemEvent: {
    type: {
      type: String,
      enum: ['created', 'user_joined', 'user_left', 'renamed']
    },
    data: Object
  },
  
  createdAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ conversationId: 1, createdAt: -1 }  // mesaj geçmişi
{ conversationId: 1, _id: -1 }        // cursor pagination
{ senderId: 1, createdAt: -1 }
```

---

### messaging_settings

```javascript
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  showOnlineStatus: { type: Boolean, default: true },
  showLastSeen: { type: Boolean, default: true },
  showTypingIndicator: { type: Boolean, default: true },
  showReadReceipts: { type: Boolean, default: true },
  
  mediaAutoDownload: {
    type: String,
    enum: ['always', 'wifi', 'never'],
    default: 'wifi'
  },
  
  autoDeleteMessages: {
    type: String,
    enum: ['off', '24h', '7d', '30d'],
    default: 'off'
  },
  
  quietHours: {
    enabled: { type: Boolean, default: false },
    startTime: String,  // "23:00"
    endTime: String     // "07:00"
  },
  
  blockedUsers: [ObjectId],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ userId: 1 }  // unique
```

---

## LISTINGS COLLECTIONS (Faz 2)

### listings

```javascript
{
  _id: ObjectId,
  sellerId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  
  // Category
  category: {
    main: String,      // "vehicles"
    sub: String,       // "cars"
    path: String       // "vehicles/cars/sedan"
  },
  
  // Content
  title: {
    type: String,
    required: true,
    maxLength: 100
  },
  description: {
    type: String,
    required: true,
    maxLength: 5000
  },
  
  // Price
  price: {
    amount: Number,
    currency: {
      type: String,
      default: 'TRY'
    },
    isNegotiable: { type: Boolean, default: false },
    priceType: {
      type: String,
      enum: ['fixed', 'negotiable', 'free', 'contact'],
      default: 'fixed'
    }
  },
  
  // Media
  media: [{
    type: {
      type: String,
      enum: ['image', 'video']
    },
    url: String,
    thumbnailUrl: String,
    order: Number,
    isMain: { type: Boolean, default: false }
  }],
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    city: String,
    district: String,
    neighborhood: String
  },
  
  // Dynamic attributes (kategori bazlı)
  attributes: {
    type: Map,
    of: Schema.Types.Mixed
    // Örnek: { brand: "BMW", model: "3 Serisi", year: 2020, km: 45000 }
  },
  
  // Contact
  contact: {
    showPhone: { type: Boolean, default: true },
    phone: String,      // override
    whatsapp: { type: Boolean, default: false }
  },
  
  // Stats
  stats: {
    viewsCount: { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
    messagesCount: { type: Number, default: 0 }
  },
  
  // Promotion
  promotion: {
    isPromoted: { type: Boolean, default: false },
    promotedUntil: Date,
    promotionType: {
      type: String,
      enum: ['featured', 'urgent', 'top']
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'sold', 'expired', 'deleted', 'hidden'],
    default: 'active'
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ "category.path": 1, status: 1, createdAt: -1 }
{ sellerId: 1, status: 1, createdAt: -1 }
{ location: "2dsphere" }
{ status: 1, "promotion.isPromoted": -1, createdAt: -1 }
{ "price.amount": 1 }
{ title: "text", description: "text" }
{ expiresAt: 1 }  // TTL check
```

---

### listing_categories

```javascript
{
  _id: ObjectId,
  slug: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    tr: String,
    en: String
  },
  parentId: {
    type: ObjectId,
    ref: 'ListingCategory',
    default: null
  },
  path: String,       // "vehicles/cars/sedan"
  level: Number,      // 0, 1, 2
  icon: String,
  order: Number,
  
  // Bu kategori için gerekli alanlar
  attributes: [{
    key: String,
    label: { tr: String, en: String },
    type: {
      type: String,
      enum: ['text', 'number', 'select', 'multiselect', 'boolean']
    },
    options: [String],   // type=select için
    required: Boolean,
    filterable: Boolean,
    order: Number
  }],
  
  isActive: { type: Boolean, default: true },
  listingsCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ slug: 1 }              // unique
{ parentId: 1, order: 1 }
{ path: 1 }
```

---

### listing_favorites

```javascript
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  listingId: {
    type: ObjectId,
    ref: 'Listing',
    required: true
  },
  createdAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ userId: 1, listingId: 1 }     // unique compound
{ userId: 1, createdAt: -1 }
```

---

### listing_settings

```javascript
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  sellerProfile: {
    storeName: String,
    description: String,
    isVerified: { type: Boolean, default: false }
  },
  
  contact: {
    showPhone: { type: Boolean, default: true },
    alternativePhone: String,
    whatsappEnabled: { type: Boolean, default: false }
  },
  
  defaultLocation: {
    coordinates: [Number],
    city: String,
    district: String
  },
  
  savedSearches: [{
    name: String,
    query: String,
    filters: Object,
    notificationsEnabled: { type: Boolean, default: true },
    createdAt: Date
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ userId: 1 }  // unique
```

---

## DATING COLLECTIONS (Faz 3)

### dating_profiles

```javascript
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  isActive: { type: Boolean, default: true },
  
  // Photos
  photos: [{
    url: String,
    order: Number,
    isMain: { type: Boolean, default: false }
  }],
  
  bio: {
    type: String,
    maxLength: 500
  },
  
  // Prompts
  prompts: [{
    question: String,
    answer: {
      type: String,
      maxLength: 200
    }
  }],
  
  // Basic info
  basics: {
    height: Number,      // cm
    zodiac: String,
    education: {
      type: String,
      enum: ['high_school', 'bachelors', 'masters', 'phd', 'other']
    },
    work: String,
    company: String,
    livingIn: String,
    languages: [String],
    religion: String
  },
  
  // Lifestyle
  lifestyle: {
    smoking: {
      type: String,
      enum: ['never', 'sometimes', 'regularly']
    },
    drinking: {
      type: String,
      enum: ['never', 'sometimes', 'regularly']
    },
    workout: {
      type: String,
      enum: ['never', 'sometimes', 'regularly']
    },
    pets: {
      type: String,
      enum: ['none', 'cat', 'dog', 'both', 'other']
    },
    children: {
      type: String,
      enum: ['none', 'have', 'want', 'dont_want']
    }
  },
  
  interests: [String],
  
  // Preferences
  preferences: {
    genderPreference: [{
      type: String,
      enum: ['male', 'female', 'other']
    }],
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 50 }
    },
    maxDistance: { type: Number, default: 50 },  // km
    showMe: { type: Boolean, default: true }
  },
  
  // Settings
  settings: {
    hideAge: { type: Boolean, default: false },
    hideDistance: { type: Boolean, default: false },
    incognitoMode: { type: Boolean, default: false }
  },
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    updatedAt: Date
  },
  
  // Stats
  stats: {
    likesReceived: { type: Number, default: 0 },
    likesSent: { type: Number, default: 0 },
    matchesCount: { type: Number, default: 0 }
  },
  
  // Boost
  boost: {
    isActive: { type: Boolean, default: false },
    expiresAt: Date
  },
  
  // Verification
  photoVerified: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ userId: 1 }                                      // unique
{ isActive: 1, location: "2dsphere" }              // discover
{ isActive: 1, "boost.isActive": -1, updatedAt: -1 }
{ isActive: 1, "preferences.genderPreference": 1 }
```

---

### swipes

```javascript
{
  _id: ObjectId,
  swiperId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  targetId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['like', 'pass', 'superlike'],
    required: true
  },
  createdAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ swiperId: 1, targetId: 1 }     // unique compound
{ targetId: 1, action: 1 }       // "beni beğenenler"
{ swiperId: 1, createdAt: -1 }
```

---

### matches

```javascript
{
  _id: ObjectId,
  users: [{
    type: ObjectId,
    ref: 'User'
  }],  // Always sorted: smaller ID first
  
  conversationId: {
    type: ObjectId,
    ref: 'Conversation'
  },
  
  status: {
    type: String,
    enum: ['active', 'unmatched'],
    default: 'active'
  },
  unmatchedBy: ObjectId,
  
  matchedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ users: 1 }                    // match check
{ "users.0": 1, status: 1 }     // user's matches
{ "users.1": 1, status: 1 }
```

---

## SYSTEM COLLECTIONS

### notifications

```javascript
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  actorId: {
    type: ObjectId,
    ref: 'User'
  },
  
  type: {
    type: String,
    enum: [
      'like', 'dislike', 'comment', 'reply', 'mention',
      'follow', 'follow_request', 'follow_accepted',
      'repost', 'quote',
      'message', 'match',
      'listing_message', 'listing_favorite',
      'system'
    ],
    required: true
  },
  
  target: {
    type: {
      type: String,
      enum: ['post', 'comment', 'user', 'conversation', 'match', 'listing']
    },
    id: ObjectId
  },
  
  content: {
    title: String,
    body: String,
    imageUrl: String
  },
  
  data: Object,  // Ek veri
  
  isRead: { type: Boolean, default: false },
  readAt: Date,
  
  createdAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ userId: 1, createdAt: -1 }
{ userId: 1, isRead: 1 }
{ createdAt: 1 }  // TTL: 90 days
```

---

### notification_settings

```javascript
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  channels: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  
  social: {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
    reposts: { type: Boolean, default: true }
  },
  
  messages: {
    directMessages: { type: Boolean, default: true },
    groupMessages: { type: Boolean, default: true },
    messageRequests: { type: Boolean, default: true }
  },
  
  dating: {
    matches: { type: Boolean, default: true },
    likes: { type: Boolean, default: true },
    superLikes: { type: Boolean, default: true }
  },
  
  listings: {
    messages: { type: Boolean, default: true },
    priceDrops: { type: Boolean, default: true },
    savedSearchAlerts: { type: Boolean, default: true }
  },
  
  display: {
    sound: { type: Boolean, default: true },
    vibration: { type: Boolean, default: true },
    showPreview: { type: Boolean, default: true },
    badgeCount: { type: Boolean, default: true }
  },
  
  quietHours: {
    enabled: { type: Boolean, default: false },
    startTime: String,
    endTime: String
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ userId: 1 }  // unique
```

---

### reports

```javascript
{
  _id: ObjectId,
  reporterId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  
  target: {
    type: {
      type: String,
      enum: ['user', 'post', 'comment', 'listing', 'message'],
      required: true
    },
    id: {
      type: ObjectId,
      required: true
    }
  },
  
  reason: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'inappropriate',
      'fake',
      'violence',
      'hate_speech',
      'scam',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    maxLength: 1000
  },
  
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending'
  },
  
  resolution: {
    action: {
      type: String,
      enum: ['none', 'warning', 'content_removed', 'user_suspended', 'user_banned']
    },
    resolvedBy: ObjectId,
    resolvedAt: Date,
    notes: String
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ status: 1, createdAt: -1 }
{ "target.type": 1, "target.id": 1 }
{ reporterId: 1 }
```

---

### feature_flags

```javascript
{
  _id: ObjectId,
  key: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  description: String,
  category: {
    type: String,
    enum: ['messaging', 'social', 'dating', 'listings', 'profile', 'notifications', 'privacy', 'premium', 'system']
  },
  
  enabled: {
    type: Boolean,
    default: false
  },
  
  rollout: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    userIds: [ObjectId]  // Beta users
  },
  
  permissions: {
    free: { type: Boolean, default: true },
    premium: { type: Boolean, default: true },
    business: { type: Boolean, default: true }
  },
  
  // Kullanıcı ayarı varsa
  userSetting: {
    hasUserSetting: { type: Boolean, default: false },
    settingKey: String,        // "showOnlineStatus"
    settingLabel: {
      tr: String,
      en: String
    },
    defaultValue: Boolean
  },
  
  regions: [String],     // ["TR", "US"] veya ["*"]
  platforms: [String],   // ["ios", "android", "web"]
  
  updatedBy: ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ key: 1 }        // unique
{ category: 1 }
{ enabled: 1 }
```

---

### trends

```javascript
{
  _id: ObjectId,
  type: {
    type: String,
    enum: ['hashtag', 'topic'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  
  stats: {
    postsCount: Number,
    interactionsCount: Number,
    score: Number
  },
  
  region: {
    type: String,
    default: 'TR'
  },
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly'],
    required: true
  },
  rank: Number,
  
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ region: 1, period: 1, rank: 1 }
{ name: 1, region: 1, period: 1 }  // unique
{ expiresAt: 1 }  // TTL
```

---

## ADMIN COLLECTIONS

### admin_users

```javascript
{
  _id: ObjectId,
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: String,
  avatar: String,
  
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator', 'support', 'analyst'],
    required: true
  },
  
  permissions: [String],
  // ['users:read', 'users:write', 'users:delete',
  //  'posts:read', 'posts:delete',
  //  'reports:read', 'reports:manage',
  //  'flags:read', 'flags:write',
  //  'analytics:read']
  
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  
  lastLoginAt: Date,
  lastLoginIp: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ email: 1 }  // unique
```

---

### admin_logs

```javascript
{
  _id: ObjectId,
  adminId: {
    type: ObjectId,
    ref: 'AdminUser',
    required: true
  },
  
  action: {
    type: String,
    required: true
    // 'user_banned', 'user_suspended', 'user_verified',
    // 'post_deleted', 'post_hidden',
    // 'report_resolved', 'report_dismissed',
    // 'flag_updated', 'flag_created',
    // 'admin_created', 'settings_changed'
  },
  
  target: {
    type: {
      type: String,
      enum: ['user', 'post', 'comment', 'listing', 'report', 'flag', 'admin', 'system']
    },
    id: ObjectId
  },
  
  details: {
    before: Object,
    after: Object,
    reason: String
  },
  
  ip: String,
  userAgent: String,
  
  createdAt: { type: Date, default: Date.now }
}

// ========== INDEXES ==========
{ adminId: 1, createdAt: -1 }
{ action: 1, createdAt: -1 }
{ "target.type": 1, "target.id": 1 }
{ createdAt: 1 }  // TTL: 365 days
```

---

## REDIS DATA STRUCTURES

```
┌─────────────────────────────────────────────────────────────────┐
│                      REDIS KEY PATTERNS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SESSION & AUTH                                                  │
│  ─────────────                                                   │
│  session:{userId}:{deviceId}  │ Hash   │ JWT data     │ 7 days  │
│  refresh:{token}              │ String │ userId       │ 7 days  │
│  blacklist:{token}            │ String │ "1"          │ 15 min  │
│                                                                  │
│  CACHE                                                           │
│  ─────                                                           │
│  user:{userId}                │ JSON   │ Profile      │ 5 min   │
│  post:{postId}                │ JSON   │ Post data    │ 5 min   │
│  feed:home:{userId}:{cursor}  │ JSON   │ Feed page    │ 1 min   │
│  feed:explore:{cursor}        │ JSON   │ Explore      │ 1 min   │
│  following:{userId}           │ Set    │ User IDs     │ 5 min   │
│  followers:{userId}           │ Set    │ User IDs     │ 5 min   │
│  pubkey:{userId}              │ String │ Public key   │ 1 hour  │
│                                                                  │
│  WEBSOCKET                                                       │
│  ─────────                                                       │
│  online:{userId}              │ Hash   │ Socket info  │ 60 sec  │
│  socket:{socketId}            │ String │ userId       │ session │
│  typing:{convId}:{userId}     │ String │ "1"          │ 3 sec   │
│                                                                  │
│  FEATURE FLAGS                                                   │
│  ─────────────                                                   │
│  flags:all                    │ JSON   │ All flags    │ 60 sec  │
│  flags:{key}                  │ JSON   │ Single flag  │ 60 sec  │
│                                                                  │
│  RATE LIMITING                                                   │
│  ────────────                                                    │
│  rate:ip:{ip}:{endpoint}      │ Number │ Count        │ 1 min   │
│  rate:user:{userId}:{endpoint}│ Number │ Count        │ 1 min   │
│                                                                  │
│  MISC                                                            │
│  ────                                                            │
│  view:{postId}:{visitorId}    │ String │ "1"          │ 1 hour  │
│  email:verify:{token}         │ String │ userId       │ 24 hour │
│  password:reset:{token}       │ String │ userId       │ 1 hour  │
│  otp:{phone}                  │ String │ code         │ 5 min   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## INDEX STRATEGY

### Compound Index Kuralları

1. **Equality first**: Eşitlik kontrolü önce
2. **Sort fields next**: Sıralama alanları sonra
3. **Range last**: Aralık sorguları en sonda

```javascript
// Örnek: User'ın postları
// Query: { authorId: X, status: 'active' } sort: { createdAt: -1 }
{ authorId: 1, status: 1, createdAt: -1 }  // ✅ Doğru sıra
```

### TTL Indexes

```javascript
// Otomatik silme
{ expiresAt: 1 }, { expireAfterSeconds: 0 }  // sessions
{ createdAt: 1 }, { expireAfterSeconds: 7776000 }  // notifications (90 gün)
{ createdAt: 1 }, { expireAfterSeconds: 31536000 }  // admin_logs (365 gün)
```

### Text Indexes

```javascript
// Full-text search
{ displayName: "text", username: "text" }  // users
{ "content.text": "text" }  // posts
{ title: "text", description: "text" }  // listings
```

### Geospatial Indexes

```javascript
// Location-based queries
{ location: "2dsphere" }  // posts, listings, dating_profiles
```
