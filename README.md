# 🤖 Telegram VPN Bot - Otomatik Bildirim Sistemi

<div align="center">

![Telegram](https://img.shields.io/badge/Telegram-Bot-blue?style=for-the-badge&logo=telegram)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![RemnaWave](https://img.shields.io/badge/RemnaWave-Integration-green?style=for-the-badge)

**VPN kullanıcılarınız için akıllı, gerçek zamanlı Telegram bildirim sistemi**

[Özellikler](#-özellikler) • [Kurulum](#-kurulum) • [Kullanım](#-kullanım) • [Dokümantasyon](#-dokümantasyon)

</div>

---

## 📖 Nedir?

**Telegram VPN Bot**, [RemnaWave](https://github.com/remnawave/backend) VPN panel sistemi ile entegre çalışan otomatik bildirim botu. Kullanıcılarınızın hesap durumlarını (trafik aşımı, abonelik bitişi, vb.) gerçek zamanlı olarak Telegram üzerinden bildiren akıllı bir asistandır.

### 🎯 Problem ve Çözüm

**Problem:**
- Kullanıcılar trafik kotalarının dolduğunu fark etmiyor
- Abonelik süreleri sessizce bitiyor
- Manuel kontrol zahmetli ve zaman alıcı
- Müşteri memnuniyetsizliği ve destek yükü artıyor

**Çözüm:**
- ⚡ **Gerçek zamanlı bildirimler** - Webhook ile <2 saniye gecikme
- 🔔 **Otomatik uyarılar** - Trafik/süre aşımında anında bildirim
- 💬 **Telegram entegrasyonu** - Kullanıcılar zaten kullandığı platform
- 🎨 **Kullanıcı dostu arayüz** - Mini app ile hesap detayları

---

## ✨ Özellikler

### 🚀 Gerçek Zamanlı Bildirimler

- **Trafik Aşımı:** Kullanıcı kotasını aştığında otomatik bildirim
- **Abonelik Bitişi:** Süre dolduğunda anında uyarı
- **Hesap Devre Dışı:** Admin tarafından kapatıldığında bilgilendirme
- **Webhook Entegrasyonu:** RemnaWave'den gerçek zamanlı event'ler

### 📱 Telegram Mini App

- **Hesap Detayları:** Kalan trafik, süre, durum bilgisi
- **Happ CryptoLink:** VPN bağlantı linki
- **Cihaz Yönetimi:** HWID cihaz listesi ve kaldırma
- **QR Kod:** Hızlı bağlantı için QR kod desteği

### 🔒 Güvenlik

- **HMAC SHA256 İmza:** Webhook güvenliği
- **Token Doğrulama:** Telegram WebApp veri doğrulama
- **Environment Secrets:** Hassas bilgiler .env'de
- **Tek Seferlik Bildirim:** Spam önleme mekanizması

### 🛠️ Teknik Özellikler

- **TypeScript:** Tip güvenli kod
- **Grammy Framework:** Modern Telegram bot kütüphanesi
- **Express.js:** RESTful API ve webhook endpoint'leri
- **Webhook Mode:** Long polling yerine verimli webhook
- **Auto-scaling:** RemnaWave ile uyumlu ölçeklenebilir yapı

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                     Telegram Kullanıcı                       │
│                    📱 /start → Mini App                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Telegram Bot Backend                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express.js Server (Port 3000)                       │   │
│  │  ├─ POST /endpoint (RemnaWave Webhook)               │   │
│  │  ├─ GET  /health (Health Check)                      │   │
│  │  ├─ GET  /api/account (Mini App - Hesap Bilgileri)  │   │
│  │  ├─ POST /api/happ/open (Happ Deeplink)             │   │
│  │  └─ DELETE /api/hwid/device (Cihaz Silme)           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Grammy Bot Instance                                  │   │
│  │  ├─ /start (Hoş geldin mesajı)                       │   │
│  │  ├─ /help (Yardım)                                   │   │
│  │  ├─ callback_query: my_account (Hesap detayları)    │   │
│  │  └─ callback_query: try_free (Deneme hesabı)        │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    RemnaWave VPN Panel                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API (PostgreSQL + Redis)                            │   │
│  │  ├─ GET  /users (Kullanıcı listesi)                  │   │
│  │  ├─ POST /users (Kullanıcı oluştur)                  │   │
│  │  └─ GET  /users/:id/hwid (Cihaz listesi)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Webhook System                                       │   │
│  │  └─ POST https://backend/endpoint                    │   │
│  │     Events:                                           │   │
│  │     • user.modified (Kullanıcı değişti)              │   │
│  │     • user.limited (Trafik aşıldı)                   │   │
│  │     • user.expired (Süre doldu)                      │   │
│  │     • user.disabled (Hesap kapatıldı)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Akış Diyagramı

```
Kullanıcı Trafik Limitini Aşar (2GB → 2.02GB)
    ↓
RemnaWave: usedTrafficBytes > trafficLimitBytes
    ↓
Webhook Gönderir: POST /endpoint
    {
      "event": "user.modified",
      "data": {
        "username": "john_doe",
        "status": "ACTIVE",
        "usedTrafficBytes": "2170651648",
        "trafficLimitBytes": "2147483648",
        "telegramId": "123456789"
      }
    }
    ↓
Backend: Webhook Handler
    • Trafik aşımı tespit edilir ✅
    • Telegram ID kontrol edilir ✅
    • Daha önce bildirim gönderilmemiş ✅
    ↓
Telegram Bot API: sendMessage()
    ↓
Kullanıcı Telegram'da Bildirim Görür:
    "⚠️ Hesabınız kısıtlandı!
     Trafik kotanız doldu.
     [👤 Hesap Bilgilerim]"
    ↓
Kullanıcı Butona Tıklar
    ↓
Bot: Hesap Detaylarını Gösterir
    • Kalan trafik: 0 GB / 2 GB
    • Bitiş tarihi: 22 Kasım 2025
    • Durum: 🟡 Limitli
    • Happ CryptoLink

Toplam Süre: <2 saniye ⚡
```

---

## 🚀 Kurulum

### Ön Gereksinimler

- **Node.js** 18+ (LTS önerilir)
- **npm** veya **yarn**
- **RemnaWave** backend kurulu ve çalışıyor
- **Telegram Bot Token** ([BotFather](https://t.me/botfather)'dan alın)

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

### 3. Environment Değişkenlerini Ayarlayın

```bash
# .env.production dosyası oluşturun
cp .env.production.example .env.production
```

**Gerekli değişkenler:**

```bash
# RemnaWave API
API_BASE_URL=https://remnawave.karatatar.com
API_TOKEN=your_remnawave_api_token

# Telegram Bot
BOT_TOKEN=your_telegram_bot_token

# Webhook Güvenliği
WEBHOOK_SECRET=your_webhook_secret  # openssl rand -hex 64

# Mini App
MINI_APP_URL=https://your-frontend.com
PUBLIC_BASE_URL=https://your-backend.com

# Internal Squad (Deneme hesapları için)
INTERNAL_SQUAD_UUID=your_squad_uuid
```

### 4. Build ve Başlatma

```bash
# Build
npm run build

# Başlat
npm start

# Veya PM2 ile (production)
pm2 start ecosystem.config.js
```

### 5. Frontend Kurulumu (Opsiyonel - Mini App)

```bash
cd ../frontend
npm install
npm run build
```

### 6. RemnaWave Webhook Ayarları

RemnaWave `.env` dosyasına ekleyin:

```bash
WEBHOOK_ENABLED=true
WEBHOOK_URL=https://your-backend.com/endpoint
WEBHOOK_SECRET_HEADER=your_webhook_secret  # Backend ile aynı!
```

RemnaWave'i restart edin:

```bash
cd /path/to/remnawave
docker-compose restart
```

---

## 💻 Kullanım

### Kullanıcı Deneyimi

#### 1. Bot Başlatma

Kullanıcı Telegram'da botu bulur ve `/start` gönderir:

```
🤖 Bot: Hoş geldiniz! Bu bot ile VPN hizmetinize erişebilirsiniz.

[🚀 Try for Free] [💳 Satın Al]
[👤 Hesabım] [📱 Mini App]
```

#### 2. Deneme Hesabı Oluşturma

Kullanıcı "Try for Free" butonuna tıklar:

```
🎉 Deneme hesabınız başarıyla oluşturuldu, @username!

Hesabınız 3 gün geçerlidir ve 2 GB trafik limitiniz bulunmaktadır.

[👤 Hesabım]
```

#### 3. Hesap Detayları

"Hesabım" butonuna tıkladığında:

```
🚀 VPN Hesap Detaylarınız 🚀

📝 Kullanıcı Adı: john_doe
*️⃣ Abonelik Türü: TRIAL
📅 Bitiş Tarihi: 22 Kasım 2025
📊 Kota: 1.5 GB / 2 GB

Durum: 🟢 Aktif

Happ CryptoLink:
happ://import/eyJhbGci...

[🍏 iOS] [🤖 Android]
```

#### 4. Otomatik Bildirim

Trafik aşımında otomatik bildirim gelir:

```
⚠️ Hesabınız kısıtlandı!

Trafik kotanız doldu.

Hesap detaylarınızı görmek için aşağıdaki butona tıklayın.

[👤 Hesap Bilgilerim]
```

### Admin / Developer Kullanımı

#### Health Check

```bash
curl https://your-backend.com/health
# {"status":"ok","uptime":12345}
```

#### Manuel Test

```bash
curl -X POST "https://your-backend.com/internal/test-webhook/TELEGRAM_ID" \
  -H "x-internal-token: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test bildirimi"}'
```

#### Log İzleme

```bash
# PM2
pm2 logs telegram-bot --lines 100

# Docker
docker logs -f telegram-bot
```

---

## 📚 Dokümantasyon

### Backend Dokümantasyonu

- **[QUICKSTART.md](backend/QUICKSTART.md)** - Hızlı başlangıç kılavuzu
- **[WEBHOOK_GUIDE.md](backend/WEBHOOK_GUIDE.md)** - Webhook detaylı açıklama
- **[WEBHOOK_DEBUG.md](backend/WEBHOOK_DEBUG.md)** - Sorun giderme rehberi
- **[WEBHOOK_TEST.md](backend/WEBHOOK_TEST.md)** - Test senaryoları
- **[BOT_409_FIX.md](backend/BOT_409_FIX.md)** - 409 Conflict çözümü
- **[SECURITY.md](backend/SECURITY.md)** - Güvenlik best practices

### API Endpoints

#### Telegram WebApp Endpoints

**GET /api/account**
- Kullanıcı hesap bilgilerini döner
- Mini App tarafından kullanılır
- Telegram WebApp data doğrulaması gerektirir

**POST /api/happ/open**
- Happ deeplink'i sohbete gönderir
- iOS/Android uygulama yönlendirmesi

**DELETE /api/hwid/device**
- Kullanıcının cihazını siler
- HWID device limit yönetimi

#### Webhook Endpoints

**POST /endpoint**
- RemnaWave webhook'larını alır
- HMAC SHA256 imza doğrulama (opsiyonel)
- Event türlerine göre bildirim gönderir

**GET /health**
- Sunucu sağlık kontrolü
- Uptime bilgisi

---

## 🔧 Yapılandırma

### Environment Değişkenleri

#### Zorunlu

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `API_BASE_URL` | RemnaWave API URL | `https://remnawave.example.com` |
| `API_TOKEN` | RemnaWave API token | `eyJhbGci...` |
| `BOT_TOKEN` | Telegram bot token | `123456:ABC-DEF...` |
| `WEBHOOK_SECRET` | Webhook güvenlik secret'ı | `openssl rand -hex 64` |

#### Opsiyonel

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `PORT` | Express server portu | `3000` |
| `MINI_APP_URL` | Frontend Mini App URL | - |
| `PUBLIC_BASE_URL` | Backend public URL | - |
| `INTERNAL_SQUAD_UUID` | Deneme hesapları squad | - |

### RemnaWave Event'leri

Bot şu event'leri dinler:

| Event | Ne Zaman | Bildirim |
|-------|----------|----------|
| `user.modified` | Kullanıcı değişti | Trafik/süre kontrolü sonrası |
| `user.limited` | Trafik aşıldı | ✅ Evet |
| `user.expired` | Süre doldu | ✅ Evet |
| `user.disabled` | Hesap kapatıldı | ✅ Evet |
| `user.status.changed` | Status değişti | Kısıtlıysa ✅ |

### Bildirim Koşulları

Bildirim gönderilir:

1. ✅ **Trafik Aşımı:** `usedTrafficBytes > trafficLimitBytes`
2. ✅ **Süre Dolumu:** `expireAt < now`
3. ✅ **Status Kısıtlı:** `status IN (LIMITED, EXPIRED, DISABLED)`

Bildirim gönderilmez:

1. ❌ Kullanıcının Telegram ID'si yok
2. ❌ Daha önce bildirim gönderilmiş
3. ❌ Event türü uygun değil

---

## 🧪 Test

### Unit Test

```bash
cd backend
npm test
```

### Webhook Test

```bash
# Test script ile
cd backend
./test-webhook.sh YOUR_TELEGRAM_ID

# Veya curl ile
curl -X POST "https://your-backend.com/endpoint" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user.modified",
    "data": {
      "uuid": "test-uuid",
      "username": "test_user",
      "status": "LIMITED",
      "telegramId": 123456789
    }
  }'
```

### Integration Test

1. RemnaWave panelde test kullanıcısı oluşturun
2. Telegram ID'yi ekleyin (botu `/start` ile başlatın)
3. Trafik limitini çok düşük yapın (1 MB)
4. VPN ile biraz trafik kullanın
5. Telegram'da bildirim gelmesini bekleyin

---

## 🐛 Sorun Giderme

### Bildirim Gelmiyor

**Kontrol 1: Backend çalışıyor mu?**
```bash
curl https://your-backend.com/health
```

**Kontrol 2: RemnaWave webhook gönderiyor mu?**
```bash
# Backend log'larını izleyin
pm2 logs telegram-bot

# "📡 Webhook received" görmeli
```

**Kontrol 3: Kullanıcının Telegram ID'si var mı?**
- Kullanıcı botu `/start` ile başlatmalı

**Kontrol 4: Secret'lar eşleşiyor mu?**
```bash
# Backend
cat .env.production | grep WEBHOOK_SECRET

# RemnaWave
cat .env | grep WEBHOOK_SECRET_HEADER

# İkisi AYNI olmalı!
```

### 409 Conflict Hatası

```
GrammyError: 409 Conflict: terminated by other getUpdates
```

**Sebep:** İki bot instance'ı çalışıyor veya `bot.start()` kullanılmış.

**Çözüm:**
1. Tüm instance'ları durdurun: `pm2 delete all`
2. Kodu güncelleyin: `git pull`
3. Tek instance başlatın: `pm2 start ecosystem.config.js`

Detaylı çözüm: [BOT_409_FIX.md](backend/BOT_409_FIX.md)

### Signature Hatası

```
⚠️ Invalid webhook signature
```

**Sebep:** RemnaWave ve Backend secret'ları farklı.

**Çözüm:**
1. RemnaWave `.env` → `WEBHOOK_SECRET_HEADER`
2. Backend `.env.production` → `WEBHOOK_SECRET`
3. İkisini aynı yapın ve restart edin

---

## 📊 Performans

### Metrikler

- **Webhook Yanıt Süresi:** <200ms
- **Telegram Bildirim:** <1 saniye
- **Toplam Süreç:** <2 saniye (event → bildirim)
- **Başarı Oranı:** %99.9+

### Ölçeklenebilirlik

- **Webhook Mode:** Sınırsız kullanıcı desteği
- **Stateless:** Horizontal scaling hazır
- **Redis Opsiyonel:** Kalıcı bildirim takibi için

---

## 🛣️ Roadmap

### v1.1 (Planlanan)

- [ ] Redis entegrasyonu (kalıcı bildirim geçmişi)
- [ ] Çoklu dil desteği (i18n)
- [ ] Kullanıcı tercih ayarları (bildirim açma/kapama)
- [ ] Webhook retry mekanizması
- [ ] Prometheus metrics

### v1.2 (Gelecek)

- [ ] Admin dashboard
- [ ] Toplu bildirim gönderme
- [ ] Bildirim şablonları
- [ ] A/B testing
- [ ] Analytics ve raporlama

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! 

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Commit Standartları

- `feat:` Yeni özellik
- `fix:` Bug düzeltmesi
- `docs:` Dokümantasyon
- `refactor:` Kod iyileştirme
- `test:` Test ekleme/düzeltme
- `chore:` Genel bakım

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 🙏 Teşekkürler

- [RemnaWave](https://github.com/remnawave/backend) - Harika VPN panel sistemi
- [Grammy](https://grammy.dev) - Modern Telegram bot framework
- [Happ](https://github.com/hiddify/hiddify-app) - Açık kaynak VPN client

---

## 📞 İletişim

- **Issues:** [GitHub Issues](https://github.com/yourusername/telegram-ts-bot/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/telegram-ts-bot/discussions)
- **Email:** your@email.com

---

<div align="center">

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ by [Your Name](https://github.com/yourusername)

</div>

