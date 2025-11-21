# Telegram Bot - Webhook Bildirim Sistemi

## 🎯 Amaç

RemnaWave paneli kullanıcı hesapları kısıtlandığında (trafik aşımı, abonelik bitişi) otomatik olarak Telegram üzerinden gerçek zamanlı bildirim gönderir.

## ⚡ Özellikler

- **Gerçek Zamanlı** - Webhook ile anında bildirim (<2 saniye)
- **Tek Seferlik** - Her kullanıcıya sadece bir kez mesaj
- **Güvenli** - HMAC SHA256 imza doğrulama
- **Minimal** - Sadece webhook, gereksiz kod yok

## 📁 Dosya Yapısı

```
backend/
├── src/
│   ├── index.ts           # Ana uygulama, bot ve endpoint'ler
│   ├── webhook.ts         # Webhook handler (gerçek zamanlı bildirimler)
│   └── api.ts             # API client fonksiyonları
├── .env.production        # Ortam değişkenleri
├── QUICKSTART.md          # Hızlı başlangıç kılavuzu
└── WEBHOOK_GUIDE.md       # Detaylı webhook dokümantasyonu
```

## 🚀 Hızlı Başlangıç

### 1. Webhook Secret Oluşturun

```bash
openssl rand -hex 32
```

### 2. Environment Değişkenlerini Ayarlayın

```bash
WEBHOOK_SECRET=your_generated_secret
API_BASE_URL=https://remnawave.karatatar.com
API_TOKEN=your_api_token
BOT_TOKEN=your_telegram_bot_token
```

### 3. RemnaWave Panelinde Webhook Ekleyin

- **URL:** `https://your-domain.com/webhook/remnawave`
- **Secret:** Yukarıdaki secret
- **Events:** user.status.changed, user.limited, user.expired, user.disabled

### 4. Deploy

```bash
npm install
npm run build
npm start
```

## 📚 Dokümantasyon

- **Hızlı Başlangıç:** [QUICKSTART.md](./QUICKSTART.md)
- **Webhook Detayları:** [WEBHOOK_GUIDE.md](./WEBHOOK_GUIDE.md)
- **RemnaWave Docs:** https://docs.rw/docs/features/webhooks

## 🔌 Endpoint'ler

### Webhook Endpoint
```
POST /endpoint
```
RemnaWave panelinden gelen webhook eventlerini işler.

### Test Endpoint
```
POST /internal/test-webhook/:telegramId
Header: x-internal-token
```
Manuel test için kullanılır.

### Health Check
```
GET /health
```
Servis durumunu kontrol eder.

## 📝 Bildirim Akışı

```
RemnaWave: User Status Changed
    ↓ (Webhook gönder)
Backend: Webhook Al & Doğrula
    ↓ (HMAC SHA256)
Backend: Telegram ID Kontrol
    ↓ (Var mı?)
Telegram: Bildirim Gönder
    ↓ (<1 saniye)
User: Bildirim Al
    ↓ ("Hesap Bilgilerim" butonuna tıkla)
Bot: Hesap Detaylarını Göster
```

## 🔒 Güvenlik

- HMAC SHA256 imza doğrulama
- Header-based authentication (x-webhook-signature)
- Tek seferlik bildirim (spam önleme)
- Environment-based secrets

## 🧪 Test

```bash
# Manuel test
curl -X POST "http://localhost:3000/internal/test-webhook/YOUR_TELEGRAM_ID" \
  -H "x-internal-token: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test"}'
```

## 💬 Bildirim Mesajı

```
⚠️ Hesabınız kısıtlandı!

Trafik kotanız doldu.

Hesap detaylarınızı görmek için aşağıdaki butona tıklayın.

[👤 Hesap Bilgilerim]
```

## 🎉 Önceki Durumdan Fark

**ÖNCE (Notifier):**
- ❌ 5 dakika gecikme
- ❌ Periyodik API kontrolü
- ❌ Yüksek kaynak kullanımı
- ❌ Karmaşık kod

**ŞIMDI (Webhook):**
- ✅ <2 saniye gecikme
- ✅ Gerçek zamanlı
- ✅ Minimal kaynak
- ✅ Temiz kod

## 📞 Destek

Sorun yaşarsanız:
1. [WEBHOOK_GUIDE.md](./WEBHOOK_GUIDE.md) dokümantasyonunu okuyun
2. Server loglarını kontrol edin
3. RemnaWave panel webhook loglarını inceleyin

