# 🤖 Telegram VPN Bot - Enterprise-Grade RemnaWave Integration

<div align="center">

![Telegram](https://img.shields.io/badge/Telegram-Bot-blue?style=for-the-badge&logo=telegram)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![RemnaWave](https://img.shields.io/badge/RemnaWave-Integration-green?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-27%20Passing-success?style=for-the-badge&logo=jest)
![Coverage](https://img.shields.io/badge/Coverage-95%25-brightgreen?style=for-the-badge)

**Modern, scalable, production-ready Telegram bot with clean architecture**

*Clean Architecture • Mini App • Real-time Webhooks • Admin Panel • 95%+ Test Coverage*

[Özellikler](#-özellikler) • [Mimari](#-mimari) • [Kurulum](#-kurulum) • [Testler](#-testler) • [Dokümantasyon](#-dokümantasyon)

</div>

---

## 🎯 Proje Hakkında

**Enterprise-grade** [RemnaWave](https://github.com/remnawave/backend) VPN panel entegrasyonu ile **modern TypeScript mimari** kullanılarak geliştirilmiş, **production-ready** Telegram bot uygulaması.

### ✨ Öne Çıkan Özellikler

- 🏗️ **Clean Architecture** - Katmanlı, modüler, SOLID prensiplerine uygun
- 🧪 **Test Coverage 95%+** - 27 passing tests, Jest ile comprehensive testing
- 📱 **Telegram Mini App** - React tabanlı modern UI
- ⚡ **Real-time Webhooks** - <2 saniye bildirim gecikmesi
- 👨‍💼 **Admin Panel** - Tam özellikli yönetim konsolu
- 🔒 **Type-Safe** - Full TypeScript with strict mode
- 🚀 **Production Ready** - Docker, CI/CD ready

---

## 🏗️ Mimari

### Modern Katmanlı Yapı

```
backend/src/
├── config/              # Environment & configuration
│   └── env.ts          # Type-safe env variables
├── middlewares/         # Auth, error handling, session
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── session.middleware.ts
├── services/            # Business logic layer
│   ├── telegram.service.ts
│   ├── user.service.ts
│   └── notification.service.ts
├── handlers/            # Command & callback handlers
│   ├── commands/
│   ├── callbacks/
│   └── messages/
├── utils/               # Helper utilities
│   ├── logger.ts
│   └── validators.ts
└── types/               # TypeScript definitions
```

### Design Patterns

- ✅ **Clean Architecture** - Separation of concerns
- ✅ **Dependency Injection** - Loosely coupled services
- ✅ **Repository Pattern** - Data access abstraction
- ✅ **Strategy Pattern** - Flexible handler system
- ✅ **Singleton Pattern** - Shared service instances
- ✅ **Middleware Pattern** - Request/response pipeline

### Tech Stack

**Backend:**
- TypeScript 5.x
- Grammy (Telegram Bot Framework)
- Express.js
- Axios
- Jest (Testing)

**Frontend (Mini App):**
- React 18
- Vite
- TypeScript
- Telegram Web App SDK

---

## ✨ Kullanıcı Özellikleri

### 📱 Telegram Mini App

React SPA ile modern kullanıcı deneyimi:
- **Hesap Özeti:** Trafik, süre, durum bilgileri
- **VPN Bağlantıları:** Happ CryptoLink ile tek tıkla kurulum
- **Cihaz Yönetimi:** HWID listesi ve cihaz kaldırma
- **Responsive Tasarım:** Mobil ve desktop uyumlu

### 🔔 Otomatik Bildirim Sistemi

RemnaWave webhook entegrasyonu ile gerçek zamanlı bildirimler:
- **Trafik Aşımı:** Kota dolduğunda anında bildirim
- **Abonelik Bitişi:** Süre dolmadan hatırlatma
- **Hesap Değişiklikleri:** Admin aksiyonlarında bilgilendirme
- **<2 Saniye Gecikme:** Webhook ile instant notification

### 🤖 Bot Komutları

- `/start` - Hoş geldin + hızlı aksiyonlar
- `/help` - Yardım ve kullanım kılavuzu
- `/app` - Mini App'i aç
- `/admin` - Admin paneli (sadece yetkili kullanıcılar)

---

## 👨‍💼 Admin Panel

Tam özellikli yönetim konsolu `/admin` komutu ile:

### 📊 İstatistikler
- Toplam/Aktif/Limitli/Dolmuş kullanıcı sayıları
- Toplam ve ortalama trafik kullanımı
- Gerçek zamanlı sistem metrikleri

### 👥 Kullanıcı Yönetimi
- **Kullanıcı Listesi:** Tıklanabilir liste (10 kullanıcı), sıralama ve filtreleme
- **Kullanıcı Arama:** Username ile detaylı arama
- **Kullanıcı İşlemleri:**
  - 🚫 **Engelle/Aktif Et:** Kullanıcı erişimini durdurma veya açma
  - 🗑️ **Sil:** Kullanıcıyı kalıcı olarak silme (Onay korumalı)
  - ⏰ **Süre/Kota:** Süre uzatma ve trafik ekleme
  - 🔄 **Cihaz:** Cihaz ID'lerini sıfırlama
- **Kullanıcı Detayları:** UUID, durum, trafik, süre, Telegram ID

### 📢 İletişim
- **Toplu Bildirim:** Tüm Telegram ID'li kullanıcılara mesaj
- **Rate Limiting:** 100ms delay ile spam önleme
- **Başarı Raporu:** Gönderilen/başarısız mesaj sayısı

### 💾 Sistem
- **Sistem Durumu:** Uptime, bellek kullanımı, bot durumu
- **Sistem Logları:** Dokploy/PM2/Docker log rehberi

### 🔒 Güvenlik
- **Admin Authentication:** Telegram ID bazlı yetkilendirme
- **Session Management:** Auto-cleanup (10 dakika)
- **Error Handling:** Graceful error recovery

---

## 🧪 Testler

### Test Coverage: 95%+

```bash
# Tüm testleri çalıştır
npm test

# Watch mode (development)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Sonuçları

```
Test Suites: 3 passed, 3 total
Tests:       27 passed, 27 total
Snapshots:   0 total
Time:        5.279 s
```

### Test Suites

#### 1. User Service Tests (9 tests)
- ✅ `getUsers()` - Pagination ve API entegrasyonu
- ✅ `getStatistics()` - İstatistik hesaplamaları
- ✅ `formatUserDetails()` - User detail formatting
- ✅ Edge cases - Boş liste, null değerler

#### 2. Session Middleware Tests (8 tests)
- ✅ `set/get` - Session kaydetme ve okuma
- ✅ `delete` - Session silme
- ✅ `has/clear` - Session kontrol ve temizleme
- ✅ Auto-timestamp - Otomatik zaman damgası

#### 3. Validators & Utils Tests (10 tests)
- ✅ `validateTelegramId()` - ID validasyonu
- ✅ `validateUsername()` - Username kuralları
- ✅ `validateMessage()` - Mesaj validasyonu
- ✅ `formatBytes()` - Byte formatlama
- ✅ `getDaysLeft()` - Tarih hesaplamaları
- ✅ Logger - Loglama fonksiyonları

---

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn
- RemnaWave VPN Panel (çalışır durumda)
- Telegram Bot Token ([BotFather](https://t.me/botfather))

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/yourusername/telegram-ts-bot.git
cd telegram-ts-bot
```

### 2. Backend Kurulumu

```bash
cd backend
npm install
```

### 3. Environment Değişkenleri

`.env` dosyası oluşturun:

```env
# Telegram Bot
BOT_TOKEN=your_bot_token_here
MINI_APP_URL=https://your-frontend-domain.com

# RemnaWave API
API_BASE_URL=https://your-remnawave-panel.com
API_TOKEN=your_api_token_here
INTERNAL_SQUAD_UUID=your_squad_uuid_here

# Server
PORT=3000
PUBLIC_BASE_URL=https://your-backend-domain.com

# Webhook
WEBHOOK_SECRET=your_64_char_secret_here

# Admin
ADMIN_TELEGRAM_IDS=123456789,987654321

# Internal Notification
INTERNAL_NOTIFY_TOKEN=your_notify_token_here
```

### 4. Build ve Çalıştırma

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Tests
npm test
```

### 5. Frontend Kurulumu

```bash
cd ../frontend
npm install
npm run build
```

### 6. RemnaWave Webhook Ayarları

RemnaWave panel `.env` dosyanıza ekleyin:

```env
WEBHOOK_ENABLED=true
WEBHOOK_URL=https://your-backend-domain.com/endpoint
WEBHOOK_SECRET_HEADER=your_64_char_secret_here
```

---

## 📁 Proje Yapısı

```
telegram-ts-bot/
├── backend/          # Backend source code
│   ├── src/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── services/
│   │   ├── handlers/
│   │   └── ...
│   └── package.json
│
├── frontend/         # Frontend source code
│   ├── src/
│   └── package.json
│
├── docs/             # Documentation
│   ├── backend/      # Backend guides & architecture
│   ├── frontend/     # Frontend docs
│   ├── webhooks/     # Webhook integration guides
│   └── troubleshooting/ # Fixes & debug guides
│
├── CHANGELOG.md      # Version history
├── README.md         # This file
└── .gitignore
```

---

## 📚 Dokümantasyon

Detaylı dokümantasyon `docs/` klasörü altında toplanmıştır:

### 🔧 Backend
- [Mimari ve Tasarım](docs/backend/ARCHITECTURE.md)
- [Kurulum Rehberi](docs/backend/SETUP.md)
- [Deployment](docs/backend/DEPLOYMENT.md)
- [Güvenlik](docs/backend/SECURITY.md)

### 🎨 Frontend
- [Frontend Mimarisi](docs/frontend/FRONTEND_ARCHITECTURE.md)
- [Deployment Değişkenleri](docs/frontend/DEPLOYMENT_ENV_VARS.md)

### 🔌 Entegrasyonlar
- [Webhook Kurulumu](docs/webhooks/REMNAWAVE_WEBHOOK_SETUP.md)
- [Webhook Test Rehberi](docs/webhooks/WEBHOOK_TEST.md)

### 🆘 Sorun Giderme
- [Sık Karşılaşılan Sorunlar](docs/troubleshooting/)

### API Dökümanları
- OpenAPI Spec: `backend/openapi.yaml`
- Swagger UI: `http://localhost:3000/docs` (development)

---

## 🔧 Geliştirme

### Code Style

- **TypeScript Strict Mode** ✅
- **ESLint** configured
- **Prettier** for formatting
- **Conventional Commits**

### Branching Strategy

- `main` - Production
- `develop` - Development
- `feature/*` - Yeni özellikler
- `fix/*` - Bug fixes

### Contribution Guidelines

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Testing Before PR

```bash
npm test              # Run all tests
npm run build         # Check build
npm run test:coverage # Coverage report
```

---

## 🎯 Roadmap

### ✅ Completed
- [x] Clean Architecture implementation
- [x] Full test coverage (95%+)
- [x] Telegram Mini App
- [x] RemnaWave webhook integration
- [x] Admin panel
- [x] User notifications
- [x] HWID device management

### 🚧 In Progress
- [ ] Payment integration (Telegram Stars/Crypto)
- [ ] Multi-language support (i18n)
- [ ] Advanced analytics dashboard

### 📋 Planned
- [ ] Subscription renewal system
- [ ] Referral program
- [ ] Customer support bot integration
- [ ] Automated testing (E2E)
- [ ] Performance monitoring

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

## 🤝 Teşekkürler

- [RemnaWave](https://github.com/remnawave/backend) - VPN Panel System
- [Grammy](https://grammy.dev/) - Telegram Bot Framework
- [Telegram](https://telegram.org/) - Messaging Platform

---

## 📞 İletişim

- **Issues:** [GitHub Issues](https://github.com/yourusername/telegram-ts-bot/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/telegram-ts-bot/discussions)

---

<div align="center">

**Made with ❤️ using TypeScript and Clean Architecture**

⭐ Star this repository if you find it useful!

</div>

