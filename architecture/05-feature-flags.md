# Feature Flags

## Genel Bakış

Feature flag sistemi, özelliklerin admin panelden anlık olarak açılıp kapatılmasını sağlar.

### Flag Yapısı

```javascript
{
  key: "msg_typing_indicator",     // Unique identifier
  name: "Typing Indicator",         // Display name
  description: "Show typing...",    // Description
  category: "messaging",            // Category
  enabled: true,                    // Global on/off
  
  rollout: {
    percentage: 100,                // 0-100 rollout
    userIds: []                     // Beta users
  },
  
  permissions: {
    free: true,                     // Available for free users
    premium: true,                  // Available for premium
    business: true                  // Available for business
  },
  
  userSetting: {
    hasUserSetting: true,           // User can toggle
    settingKey: "showTypingIndicator",
    settingLabel: {
      tr: "Yazıyor göstergesini göster",
      en: "Show typing indicator"
    },
    defaultValue: true
  },
  
  regions: ["*"],                   // All regions or specific
  platforms: ["ios", "android", "web"]
}
```

---

## Kategoriler

| Kategori | Prefix | Açıklama |
|----------|--------|----------|
| messaging | `msg_` | Mesajlaşma özellikleri |
| social | `social_` | Sosyal medya özellikleri |
| listings | `listing_` | İlan modülü |
| dating | `dating_` | Flört modülü |
| profile | `profile_` | Profil özellikleri |
| notifications | `notif_` | Bildirim özellikleri |
| privacy | `privacy_` | Gizlilik özellikleri |
| premium | `premium_` | Premium özellikleri |
| system | `sys_` | Sistem özellikleri |

---

## MESAJLAŞMA (messaging)

| Key | Name | User Setting | Default | Premium |
|-----|------|--------------|---------|---------|
| `msg_typing_indicator` | Typing Indicator | Yazıyor göster/gizle | ON | No |
| `msg_online_status` | Online Status | Çevrimiçi durumu göster | ON | No |
| `msg_read_receipts` | Read Receipts | Okundu bilgisi göster | ON | No |
| `msg_last_seen` | Last Seen | Son görülme göster | ON | No |
| `msg_delivery_receipts` | Delivery Receipts | İletildi bilgisi | ON | No |
| `msg_voice_messages` | Voice Messages | - | OFF | Yes |
| `msg_video_messages` | Video Messages | - | OFF | Yes |
| `msg_video_calls` | Video Calls | - | OFF | v2 |
| `msg_voice_calls` | Voice Calls | - | OFF | v2 |
| `msg_group_chats` | Group Chats | - | OFF | v2 |
| `msg_message_reactions` | Message Reactions | - | OFF | No |
| `msg_message_edit` | Edit Messages | - | OFF | No |
| `msg_message_delete` | Delete Messages | Herkesten silme | ON | No |
| `msg_auto_delete` | Auto Delete | Otomatik silme süresi | OFF | Yes |
| `msg_link_preview` | Link Preview | - | ON | No |
| `msg_media_auto_download` | Auto Download | İndirme tercihi | ON | No |
| `msg_chat_themes` | Chat Themes | Sohbet teması | OFF | No |
| `msg_chat_wallpaper` | Chat Wallpaper | Arka plan | OFF | No |

### Mesajlaşma Ayar Detayları

```
msg_typing_indicator:
  - Admin açık → Kullanıcı ayarı gösterilir
  - Admin kapalı → Özellik tamamen kapalı, ayar gizli
  - Kullanıcı açık → Kendi yazıyor durumu karşıya gider
  - Kullanıcı kapalı → Kendi yazıyor durumu gitmez

msg_online_status:
  - Kullanıcı açık → Çevrimiçi durumu görünür
  - Kullanıcı kapalı → Çevrimiçi durumu gizli

msg_read_receipts:
  - Kullanıcı açık → Okudu bilgisi gider
  - Kullanıcı kapalı → Okudu bilgisi gitmez (ama kendisi de göremez)

msg_auto_delete:
  - Premium özellik
  - Seçenekler: off, 24h, 7d, 30d
  - Seçilen süre sonunda mesajlar otomatik silinir
```

---

## SOSYAL MEDYA (social)

| Key | Name | User Setting | Default | Premium |
|-----|------|--------------|---------|---------|
| `social_stories` | Stories | - | OFF | v2 |
| `social_story_replies` | Story Replies | Yanıt alabilir | ON | No |
| `social_story_reactions` | Story Reactions | - | OFF | No |
| `social_polls` | Polls | - | ON | No |
| `social_live_streaming` | Live Streaming | - | OFF | v3 |
| `social_spaces` | Spaces | - | OFF | v3 |
| `social_repost_with_quote` | Quote Repost | - | ON | No |
| `social_scheduled_posts` | Scheduled Posts | - | OFF | Yes |
| `social_post_analytics` | Post Analytics | İstatistik gör | OFF | Yes |
| `social_close_friends` | Close Friends | Yakın arkadaşlar | OFF | No |
| `social_hide_likes` | Hide Likes | Beğeni sayısı gizle | ON | No |
| `social_disable_comments` | Disable Comments | Varsayılan kapalı | ON | No |
| `social_sensitive_content` | Sensitive Filter | İçerik filtrele | ON | No |
| `social_content_language` | Content Language | Dil filtresi | OFF | No |
| `social_muted_words` | Muted Words | Engelli kelimeler | ON | No |
| `social_post_location` | Post Location | Konum ekle | ON | No |
| `social_gif_support` | GIF Support | - | ON | No |
| `social_sticker_support` | Stickers | - | OFF | No |
| `social_mention_anyone` | Mention Anyone | Etiketleme izni | ON | No |
| `social_who_can_reply` | Reply Control | Yanıt izni | ON | No |
| `social_pin_posts` | Pin Posts | - | ON | No |
| `social_bookmarks` | Bookmarks | - | ON | No |
| `social_bookmark_folders` | Bookmark Folders | Klasörler | OFF | Yes |
| `social_download_posts` | Download Posts | - | OFF | No |

### Sosyal Medya Ayar Detayları

```
social_hide_likes:
  - Kullanıcı kendi postlarında beğeni sayısını gizleyebilir
  - Diğer kullanıcılar sayıyı göremez

social_who_can_reply:
  - Post oluştururken seçenek
  - everyone: Herkes yanıtlayabilir
  - followers: Sadece takipçiler
  - mentioned: Sadece etiketlenenler
  - none: Kimse yanıtlayamaz

social_scheduled_posts:
  - Premium özellik
  - Gelecek tarih/saat seçimi
  - Max 30 gün ileri
```

---

## İLAN MODÜLÜ (listings)

| Key | Name | User Setting | Default | Premium |
|-----|------|--------------|---------|---------|
| `listing_module` | Listing Module | - | OFF | Faz 2 |
| `listing_promoted` | Promoted Listings | - | ON | Paid |
| `listing_urgent_badge` | Urgent Badge | - | ON | Paid |
| `listing_verified_seller` | Verified Seller | - | OFF | No |
| `listing_video_upload` | Video Upload | - | OFF | Yes |
| `listing_unlimited_photos` | Unlimited Photos | - | OFF | Yes |
| `listing_bump_up` | Bump Up | - | ON | Paid |
| `listing_price_history` | Price History | - | OFF | No |
| `listing_seller_rating` | Seller Rating | - | ON | No |
| `listing_safe_payment` | Safe Payment | - | OFF | v3 |
| `listing_shipping` | Shipping | Kargo desteği | OFF | v3 |
| `listing_negotiation_chat` | Negotiation | Pazarlık modu | OFF | No |
| `listing_auto_renew` | Auto Renew | Otomatik yenile | OFF | Yes |
| `listing_analytics` | Listing Analytics | İstatistikler | OFF | Yes |
| `listing_similar_alert` | Similar Alert | Benzer ilan bildirimi | ON | No |
| `listing_price_drop_alert` | Price Drop Alert | Fiyat düşüşü | ON | No |
| `listing_saved_searches` | Saved Searches | Arama kaydet | ON | No |
| `listing_location_radius` | Location Radius | Mesafe ayarı | ON | No |

### İlan Ücretli Özellikler

```
listing_promoted:
  - İlanı öne çıkarma
  - Süre: 7/14/30 gün
  - Fiyat: 50/90/150 TL

listing_urgent_badge:
  - "ACİL" badge'i
  - Süre: 3 gün
  - Fiyat: 30 TL

listing_bump_up:
  - İlanı yenile (tarih güncelle)
  - Fiyat: 20 TL
```

---

## FLÖRT MODÜLÜ (dating)

| Key | Name | User Setting | Default | Premium |
|-----|------|--------------|---------|---------|
| `dating_module` | Dating Module | Flört aktif | OFF | Faz 3 |
| `dating_super_like` | Super Like | - | ON | Limited |
| `dating_unlimited_likes` | Unlimited Likes | - | OFF | Yes |
| `dating_rewind` | Rewind | Geri al | OFF | Yes |
| `dating_boost` | Boost | Öne çıkar | ON | Paid |
| `dating_see_who_liked` | See Who Liked | - | OFF | Yes |
| `dating_advanced_filters` | Advanced Filters | Detaylı filtre | OFF | Yes |
| `dating_incognito_mode` | Incognito Mode | Gizli gezin | OFF | Yes |
| `dating_hide_age` | Hide Age | Yaş gizle | OFF | Yes |
| `dating_hide_distance` | Hide Distance | Mesafe gizle | OFF | Yes |
| `dating_passport` | Passport | Konum değiştir | OFF | Yes |
| `dating_top_picks` | Top Picks | Günün seçilmişleri | OFF | Yes |
| `dating_read_receipts` | Read Receipts | Match okundu | OFF | Yes |
| `dating_priority_likes` | Priority Likes | Öncelikli gösterim | OFF | Yes |
| `dating_video_profile` | Video Profile | Video profil | OFF | No |
| `dating_prompts` | Prompts | Hakkımda soruları | ON | No |
| `dating_interests_tags` | Interest Tags | İlgi alanları | ON | No |
| `dating_spotify_anthem` | Spotify Anthem | Spotify entegrasyonu | OFF | No |
| `dating_instagram_photos` | Instagram Photos | Instagram fotoğrafları | OFF | No |
| `dating_verification_badge` | Photo Verification | Fotoğraf doğrulama | ON | No |
| `dating_smart_photos` | Smart Photos | AI fotoğraf sıralama | OFF | v3 |

### Flört Limitler

```
Free:
  - 50 like/gün
  - 1 super like/gün
  - 0 rewind
  - Temel filtreler (yaş, mesafe)

Premium:
  - Unlimited like
  - 5 super like/gün
  - Unlimited rewind
  - Gelişmiş filtreler
  - See who liked
  - Incognito mode
  - 1 boost/ay dahil

Boost:
  - 30 dakika öne çıkma
  - 10x görünürlük
  - Fiyat: 50 TL
```

---

## PROFİL (profile)

| Key | Name | User Setting | Default | Premium |
|-----|------|--------------|---------|---------|
| `profile_private_account` | Private Account | Gizli hesap | ON | No |
| `profile_verification` | Verification | Mavi tik başvuru | ON | No |
| `profile_activity_status` | Activity Status | Aktiflik göster | ON | No |
| `profile_link_in_bio` | Link in Bio | - | ON | No |
| `profile_multiple_links` | Multiple Links | Çoklu link | OFF | Yes |
| `profile_custom_username` | Custom Username | Kullanıcı adı değiştir | ON | Limited |
| `profile_cover_video` | Cover Video | Kapak videosu | OFF | Yes |
| `profile_highlights` | Highlights | Story highlights | OFF | v2 |
| `profile_qr_code` | QR Code | QR ile paylaş | ON | No |
| `profile_nft_avatar` | NFT Avatar | - | OFF | v4 |

### Profil Limitler

```
profile_custom_username:
  - Free: 1 değişiklik / 30 gün
  - Premium: 3 değişiklik / 30 gün

profile_multiple_links:
  - Free: 1 link
  - Premium: 5 link
```

---

## BİLDİRİMLER (notifications)

| Key | Name | User Setting | Default | Premium |
|-----|------|--------------|---------|---------|
| `notif_push` | Push Notifications | Push bildirim | ON | No |
| `notif_email` | Email Notifications | Email bildirim | ON | No |
| `notif_sms` | SMS Notifications | SMS bildirim | OFF | No |
| `notif_likes` | Like Notifications | Beğeni bildirimi | ON | No |
| `notif_comments` | Comment Notifications | Yorum bildirimi | ON | No |
| `notif_mentions` | Mention Notifications | Etiket bildirimi | ON | No |
| `notif_follows` | Follow Notifications | Takip bildirimi | ON | No |
| `notif_messages` | Message Notifications | Mesaj bildirimi | ON | No |
| `notif_matches` | Match Notifications | Eşleşme bildirimi | ON | No |
| `notif_listing_messages` | Listing Messages | İlan mesajı | ON | No |
| `notif_price_drops` | Price Drops | Fiyat düşüşü | ON | No |
| `notif_digest` | Daily/Weekly Digest | Özet bildirim | OFF | No |
| `notif_quiet_hours` | Quiet Hours | Sessiz saatler | OFF | No |
| `notif_sound` | Notification Sound | Ses | ON | No |
| `notif_vibration` | Vibration | Titreşim | ON | No |
| `notif_preview` | Preview | İçerik önizleme | ON | No |

### Bildirim Ayar Detayları

```
notif_quiet_hours:
  - Başlangıç saati: 23:00
  - Bitiş saati: 07:00
  - Bu saatler arası bildirim gelmez

notif_digest:
  - daily: Günlük özet (sabah 09:00)
  - weekly: Haftalık özet (Pazartesi 09:00)
```

---

## GİZLİLİK (privacy)

| Key | Name | User Setting | Default | Premium |
|-----|------|--------------|---------|---------|
| `privacy_two_factor` | Two Factor Auth | 2FA aktif | ON | No |
| `privacy_login_alerts` | Login Alerts | Yeni giriş bildirimi | ON | No |
| `privacy_active_sessions` | Active Sessions | Oturumları görüntüle | ON | No |
| `privacy_blocked_users` | Blocked Users | Engelliler | ON | No |
| `privacy_muted_users` | Muted Users | Sessize alınanlar | ON | No |
| `privacy_restricted_users` | Restricted Users | Kısıtlananlar | OFF | No |
| `privacy_data_download` | Data Download | Verilerimi indir | ON | No |
| `privacy_account_delete` | Account Delete | Hesabı sil | ON | No |
| `privacy_hide_from_search` | Hide From Search | Aramada gizle | OFF | No |
| `privacy_hide_contacts` | Hide From Contacts | Rehberden gizle | OFF | No |
| `privacy_screenshot_alert` | Screenshot Alert | SS bildirimi | OFF | Yes |
| `privacy_who_can_dm` | Who Can DM | DM izni | ON | No |
| `privacy_who_can_tag` | Who Can Tag | Etiket izni | ON | No |
| `privacy_who_can_see_followers` | Follower Visibility | Takipçi gizliliği | ON | No |

### Gizlilik Ayar Seçenekleri

```
privacy_who_can_dm:
  - everyone: Herkes mesaj atabilir
  - followers: Sadece takipçiler
  - none: Kimse mesaj atamaz

privacy_who_can_tag:
  - everyone: Herkes etiketleyebilir
  - followers: Sadece takipçiler
  - none: Kimse etiketleyemez
```

---

## PREMIUM (premium)

| Key | Name | User Setting | Default | Premium |
|-----|------|--------------|---------|---------|
| `premium_subscription` | Subscription | Premium satın al | ON | - |
| `premium_business_account` | Business Account | İşletme hesabı | OFF | v2 |
| `premium_creator_mode` | Creator Mode | İçerik üretici | OFF | v2 |
| `payments_wallet` | Wallet | Cüzdan | OFF | v3 |
| `payments_tips` | Tips | Bahşiş gönder | OFF | v3 |
| `payments_paid_content` | Paid Content | Ücretli içerik | OFF | v4 |
| `ads_promoted_posts` | Promoted Posts | Reklam ver | OFF | v2 |
| `ads_show_ads` | Show Ads | Reklam göster | OFF | - |
| `ads_personalized` | Personalized Ads | Kişisel reklam | OFF | - |

---

## SİSTEM (system)

| Key | Name | Description | Default |
|-----|------|-------------|---------|
| `sys_maintenance_mode` | Maintenance | Bakım modu | OFF |
| `sys_registration` | Registration | Kayıt açık | ON |
| `sys_invite_only` | Invite Only | Davetiye sistemi | OFF |
| `sys_ai_moderation` | AI Moderation | AI moderasyon | ON |
| `sys_ai_recommendations` | AI Recommendations | AI öneriler | OFF |
| `sys_ai_translate` | AI Translate | Otomatik çeviri | OFF |
| `sys_ai_summarize` | AI Summarize | Özet oluştur | OFF |
| `sys_dark_mode` | Dark Mode | Karanlık tema | ON |
| `sys_app_language` | App Language | Dil seçimi | ON |
| `sys_data_saver` | Data Saver | Veri tasarrufu | ON |
| `sys_auto_play_videos` | Auto Play | Otomatik oynat | ON |
| `sys_reduce_motion` | Reduce Motion | Animasyon azalt | ON |
| `sys_haptic_feedback` | Haptic Feedback | Dokunsal geri bildirim | ON |

---

## Config API Response

```json
{
  "success": true,
  "data": {
    "features": {
      "msg_typing_indicator": true,
      "msg_online_status": true,
      "msg_read_receipts": true,
      "msg_voice_messages": false,
      "msg_video_calls": false,
      "social_stories": false,
      "social_polls": true,
      "social_live_streaming": false,
      "dating_module": false,
      "listing_module": false,
      "sys_maintenance_mode": false
    },
    "premiumFeatures": [
      "msg_voice_messages",
      "msg_video_messages",
      "msg_auto_delete",
      "social_scheduled_posts",
      "social_post_analytics",
      "social_bookmark_folders",
      "listing_video_upload",
      "listing_unlimited_photos",
      "listing_auto_renew",
      "listing_analytics",
      "dating_unlimited_likes",
      "dating_rewind",
      "dating_see_who_liked",
      "dating_advanced_filters",
      "dating_incognito_mode",
      "dating_hide_age",
      "dating_hide_distance",
      "dating_passport",
      "dating_top_picks",
      "dating_read_receipts",
      "dating_priority_likes",
      "profile_multiple_links",
      "profile_cover_video",
      "privacy_screenshot_alert"
    ],
    "userSettingKeys": {
      "msg_typing_indicator": "showTypingIndicator",
      "msg_online_status": "showOnlineStatus",
      "msg_read_receipts": "showReadReceipts",
      "msg_last_seen": "showLastSeen",
      "social_hide_likes": "hideLikes",
      "notif_push": "pushEnabled",
      "notif_email": "emailEnabled"
    }
  }
}
```

---

## Flutter Kullanım Örnekleri

### Feature Check

```dart
class FeatureFlagService {
  final Map<String, bool> _flags;
  final List<String> _premiumFeatures;
  
  bool isEnabled(String key) {
    return _flags[key] ?? false;
  }
  
  bool isPremiumFeature(String key) {
    return _premiumFeatures.contains(key);
  }
  
  bool canUseFeature(String key, User user) {
    if (!isEnabled(key)) return false;
    if (!isPremiumFeature(key)) return true;
    return user.subscription.plan != 'free';
  }
}
```

### Settings Page

```dart
class SettingsPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final flags = context.read<FeatureFlagService>();
    final user = context.read<UserCubit>().state.user;
    
    return ListView(
      children: [
        // Sadece flag açıksa göster
        if (flags.isEnabled('msg_online_status'))
          SwitchListTile(
            title: Text('Çevrimiçi durumumu göster'),
            value: user.settings.showOnlineStatus,
            onChanged: (v) => updateSetting('showOnlineStatus', v),
          ),
        
        // Premium feature
        if (flags.isEnabled('msg_voice_messages'))
          if (user.isPremium)
            VoiceMessageSettings()
          else
            PremiumUpsellTile(
              title: 'Sesli Mesaj',
              description: 'Premium ile sesli mesaj gönderin',
            ),
            
        // Modül açıksa göster
        if (flags.isEnabled('dating_module'))
          ListTile(
            title: Text('Flört Ayarları'),
            onTap: () => Navigator.push(...),
          ),
      ],
    );
  }
}
```

### Conditional UI

```dart
class ChatInputWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final flags = context.read<FeatureFlagService>();
    
    return Row(
      children: [
        // Voice message button (if enabled)
        if (flags.canUseFeature('msg_voice_messages', user))
          IconButton(
            icon: Icon(Icons.mic),
            onPressed: startVoiceRecording,
          ),
        
        // Text input
        Expanded(child: TextField(...)),
        
        // Send button
        IconButton(
          icon: Icon(Icons.send),
          onPressed: sendMessage,
        ),
      ],
    );
  }
}
```

---

## Admin Panel

### Flag Yönetimi

```
┌─────────────────────────────────────────────────────────────────┐
│ Feature Flags                                          [+ New] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Filter: [All Categories ▼] [All Status ▼] [Search...]         │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ msg_typing_indicator                              [ON]  [⚙]││
│ │ Typing Indicator                                           ││
│ │ Category: messaging | Rollout: 100% | Premium: No          ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ msg_voice_messages                               [OFF]  [⚙]││
│ │ Voice Messages                                             ││
│ │ Category: messaging | Rollout: 0% | Premium: Yes           ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ dating_module                                    [OFF]  [⚙]││
│ │ Dating Module                                              ││
│ │ Category: dating | Rollout: 0% | Faz 3                     ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flag Detay Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Edit: msg_voice_messages                                    [X]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Name: Voice Messages                                           │
│ Key: msg_voice_messages                                        │
│ Category: [messaging ▼]                                        │
│                                                                 │
│ Status: [○ OFF  ● ON]                                         │
│                                                                 │
│ Rollout:                                                        │
│ ├── Percentage: [====50%====] 50%                             │
│ └── Beta Users: user_123, user_456 [+ Add]                    │
│                                                                 │
│ Permissions:                                                    │
│ ├── [✓] Free users                                            │
│ ├── [✓] Premium users                                         │
│ └── [✓] Business users                                        │
│                                                                 │
│ User Setting:                                                   │
│ ├── [✓] Has user setting                                      │
│ ├── Setting Key: showVoiceMessages                            │
│ └── Default: [ON]                                             │
│                                                                 │
│ Platforms: [✓] iOS  [✓] Android  [✓] Web                     │
│ Regions: [*] All                                               │
│                                                                 │
│                              [Cancel] [Save Changes]           │
└─────────────────────────────────────────────────────────────────┘
```
