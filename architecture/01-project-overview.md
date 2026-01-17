# SuperApp - Proje Özeti

## Vizyon

Türkiye'nin en kapsamlı sosyal platformu.
Tek uygulamada: **Sosyal Medya + İlan + Flört**

---

## Hedef Kitle

| Özellik | Değer |
|---------|-------|
| Yaş Aralığı | 18-45 |
| Birincil Pazar | Türkiye |
| İkincil Pazar | Avrupa, ABD (Türk diasporası) |
| Platform | Mobile-first (iOS, Android, Web) |

---

## Modüller

### 1. Sosyal Medya Modülü (MVP - Faz 1)

Twitter/X benzeri mikroblog platformu.

**Özellikler:**
- Post (text, image, video, poll)
- Like / Dislike / Comment / Repost
- Follow sistemi (public/private hesap)
- Feed (Home timeline + Explore)
- Hashtag & Trending
- Direct Message (E2EE şifreli)
- Push notifications
- User profiles
- Search (users, posts, hashtags)

**Hedef:** Kullanıcıların düşüncelerini paylaşması, topluluk oluşturması.

---

### 2. İlan Modülü (Faz 2)

Sahibinden/Letgo benzeri ilan platformu.

**Özellikler:**
- İlan oluşturma (çoklu kategori)
- Fotoğraf/video yükleme
- Kategori ağacı
- Gelişmiş arama & filtreler
- Konum bazlı arama
- Favorilere ekleme
- Satıcı ile mesajlaşma
- İlan öne çıkarma (ücretli)
- Fiyat düşüşü bildirimi
- Satıcı puanlama

**Kategoriler:**
- Vasıta (araba, motorsiklet)
- Emlak (satılık, kiralık)
- Elektronik
- Ev & Yaşam
- Giyim
- Diğer

**Hedef:** Kullanıcıların ikinci el alım-satım yapması.

---

### 3. Flört Modülü (Faz 3)

Tinder/Bumble benzeri eşleşme platformu.

**Özellikler:**
- Ayrı flört profili
- Fotoğraf galerisi (max 6)
- Bio & Prompts (hakkımda soruları)
- Discover ekranı
- Swipe mekanizması (Like/Pass/SuperLike)
- Match sistemi
- Match sonrası mesajlaşma
- Konum bazlı eşleşme
- Yaş & mesafe filtreleri
- Boost (profile öne çıkarma)
- Incognito mode (premium)

**Hedef:** Kullanıcıların romantik ilişki kurması.

---

## MVP Scope (Faz 1)

### Dahil
- [x] Auth (email/password, Google, Apple)
- [x] User registration & login
- [x] User profiles (view, edit)
- [x] Follow/unfollow system
- [x] Posts (create, edit, delete)
- [x] Post types: text, image, video, poll
- [x] Feed: Home (following) + Explore
- [x] Interactions: like, dislike, comment, repost
- [x] Bookmarks
- [x] Hashtag support
- [x] User search
- [x] Direct messages (E2EE)
- [x] Push notifications (FCM)
- [x] Admin panel (basic)
- [x] Feature flags system

### Hariç (Sonraki fazlar)
- [ ] Stories
- [ ] Live streaming
- [ ] Voice/video calls
- [ ] Group chats
- [ ] İlan modülü
- [ ] Flört modülü
- [ ] Payment/subscription
- [ ] Ads system

---

## Teknik Stack

### Backend
| Teknoloji | Kullanım |
|-----------|----------|
| Node.js 20+ | Runtime |
| NestJS | Framework |
| TypeScript | Language |
| MongoDB | Primary database |
| Redis | Cache, sessions, real-time |
| Socket.IO | WebSocket |

### Frontend
| Teknoloji | Kullanım |
|-----------|----------|
| Flutter | Mobile + Web |
| Dart | Language |
| Bloc/Cubit | State management |
| GetIt | Dependency injection |
| GoRouter | Navigation |

### Infrastructure
| Teknoloji | Kullanım |
|-----------|----------|
| GCP Cloud Run | Microservices hosting |
| MongoDB Atlas | Managed database |
| GCP Memorystore | Managed Redis |
| GCP Cloud Storage | Media storage |
| GCP Pub/Sub | Event messaging |
| GCP Cloud Build | CI/CD |
| Terraform | Infrastructure as Code |

### Security
| Teknoloji | Kullanım |
|-----------|----------|
| JWT | Authentication |
| bcrypt | Password hashing |
| X25519 + AES-GCM | E2EE messaging |
| Cloud Armor | WAF/DDoS |

---

## Mimari Yaklaşım

### Backend
- **Clean Architecture**: Domain, Application, Infrastructure, Presentation
- **Microservices**: 12 bağımsız servis
- **Monorepo**: pnpm workspaces + Turborepo

### Frontend
- **Feature-first**: Her modül kendi klasöründe
- **Clean Architecture**: Data, Domain, Presentation katmanları
- **Offline-first**: Local cache (SQLite)

---

## Gelir Modeli

### 1. Premium Subscription (Aylık/Yıllık)

**Sosyal Premium:**
- Sesli mesaj
- Mesaj zamanlama
- Post analytics
- Bookmark klasörleri
- Reklamsız deneyim

**Dating Premium:**
- Unlimited likes
- See who liked you
- Rewind (geri al)
- 5 Super Like/gün
- Incognito mode
- Advanced filters

### 2. Tek Seferlik Satın Alma

**İlan Modülü:**
- İlan öne çıkarma
- Acil badge
- İlan yenileme (bump)

**Flört Modülü:**
- Boost (30 dk öne çıkma)
- Super Like paketi

### 3. Reklam (Faz 4+)
- Feed içi native reklamlar
- Promoted posts

---

## KPI Hedefleri

### Engagement
| Metrik | Hedef |
|--------|-------|
| DAU/MAU | > %40 |
| Session duration | > 15 dk |
| Posts per user/day | > 0.5 |
| Messages per user/day | > 5 |

### Retention
| Metrik | Hedef |
|--------|-------|
| D1 Retention | > %50 |
| D7 Retention | > %30 |
| D30 Retention | > %15 |

### Performance
| Metrik | Hedef |
|--------|-------|
| Feed load time | < 500ms |
| Message delivery | < 100ms |
| App crash rate | < %0.1 |
| API error rate | < %1 |

### Business (Post-MVP)
| Metrik | Hedef |
|--------|-------|
| Premium conversion | > %5 |
| ARPU | > $2/ay |

---

## Geliştirme Timeline

### Faz 0: Altyapı (2 hafta)
- [x] Monorepo setup
- [x] Shared packages
- [x] Docker compose (local dev)
- [x] CI/CD pipeline
- [x] Terraform base

### Faz 1: Auth & User (2 hafta)
- [ ] auth-service
- [ ] user-service
- [ ] api-gateway
- [ ] Feature flags
- [ ] Flutter: Auth flow

### Faz 2: Social Core (3 hafta)
- [ ] post-service
- [ ] interaction-service
- [ ] feed-service
- [ ] Flutter: Feed, Post, Profile

### Faz 3: Media & Notifications (2 hafta)
- [ ] media-service
- [ ] notification-service
- [ ] Flutter: Upload, Push

### Faz 4: Messaging (3 hafta)
- [ ] message-service (WebSocket)
- [ ] E2EE implementation
- [ ] Flutter: Chat UI

### Faz 5: Admin Panel (2 hafta)
- [ ] admin-service
- [ ] React admin panel
- [ ] Moderation tools

---

**MVP Toplam: ~14 hafta (3.5 ay)**

---

### Faz 6: İlan Modülü (4 hafta)
- [ ] listing-service
- [ ] Categories
- [ ] Search
- [ ] Flutter: Listing pages

### Faz 7: Flört Modülü (4 hafta)
- [ ] dating-service
- [ ] Discover algorithm
- [ ] Match system
- [ ] Flutter: Dating pages

### Faz 8: Premium & Payments (2 hafta)
- [ ] Subscription system
- [ ] Payment integration
- [ ] Premium features

---

## Riskler & Mitigasyon

| Risk | Olasılık | Etki | Mitigasyon |
|------|----------|------|------------|
| Solo developer burnout | Yüksek | Yüksek | Faz faz ilerle, MVP first |
| Scaling issues | Orta | Yüksek | Microservices, auto-scale |
| Content moderation | Yüksek | Orta | AI moderation + report system |
| Competition | Yüksek | Orta | 3-in-1 unique value |
| Security breach | Düşük | Çok Yüksek | E2EE, security audit |
| Cost overrun | Orta | Orta | Serverless, pay-per-use |

---

## Başarı Kriterleri

### MVP Launch (3.5 ay)
- 1,000 kayıtlı kullanıcı
- 100 DAU
- Core features çalışıyor
- Crash rate < %1

### 6 Ay
- 50,000 kayıtlı kullanıcı
- 5,000 DAU
- İlan modülü live
- Premium launch

### 12 Ay
- 500,000 kayıtlı kullanıcı
- 50,000 DAU
- Tüm modüller live
- Pozitif unit economics

---

## Takım (Mevcut)

| Rol | Kişi | Sorumluluk |
|-----|------|------------|
| Founder/Developer | 1 | Her şey |

### Gelecek İhtiyaçlar
- Backend Developer (scale sonrası)
- Mobile Developer (scale sonrası)
- UI/UX Designer (freelance)
- Content Moderator (10K+ user sonrası)
