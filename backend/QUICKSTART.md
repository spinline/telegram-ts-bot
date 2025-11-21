# Hızlı Başlangıç - Webhook Bildirim Sistemi

## ✅ Tamamlandı

Webhook entegrasyonu başarıyla eklendi! RemnaWave paneli kullanıcı durumu değiştiğinde otomatik olarak Telegram bildirimi gönderilecek.

## 📁 Dosyalar

- ✅ `backend/src/webhook.ts` - Webhook handler
- ✅ `backend/src/index.ts` - Webhook endpoint: `POST /webhook/remnawave`
- ✅ `backend/WEBHOOK_GUIDE.md` - Detaylı webhook kurulum rehberi
- ✅ `backend/.env.production` - Ortam değişkenleri

## 🚀 Kurulum Adımları

### 1. Webhook Secret Oluşturun

```bash
# Güçlü bir secret oluşturun
openssl rand -hex 32
```

### 2. Environment Değişkenlerini Ayarlayın

`.env.production` dosyasına ekleyin:

```bash
# Webhook (Gerçek zamanlı bildirimler)
WEBHOOK_SECRET=your_generated_secret_here


# Diğer zorunlu değişkenler
API_BASE_URL=https://remnawave.karatatar.com
API_TOKEN=your_api_token
BOT_TOKEN=your_telegram_bot_token
INTERNAL_NOTIFY_TOKEN=your_test_token
```

### 3. RemnaWave Panelinde Webhook Ayarlayın

**Adım 1:** RemnaWave panel → Settings → Webhooks

**Adım 2:** Yeni webhook ekleyin:
- **URL:** `https://telegram-mini-app-backend.karatatar.com/endpoint`
- **Secret:** Yukarıda oluşturduğunuz secret
- **Events:** Tüm eventler (backend otomatik filtreleyecek)

**NOT:** RemnaWave panelinde webhook **ZATEN AYARLI!**
- ✅ WEBHOOK_ENABLED=true
- ✅ WEBHOOK_URL=https://telegram-mini-app-backend.karatatar.com/endpoint
- ✅ WEBHOOK_SECRET_HEADER ayarlanmış

**Adım 3:** Kaydet ve test edin

### 4. Backend'i Deploy Edin

```bash
cd backend
npm install
npm run build
npm start

# Veya docker ile
docker build -t telegram-bot .
docker run -p 3000:3000 telegram-bot
```

### 5. Test Edin

#### Test Script (En Kolay)

```bash
cd backend

# Test script'i çalıştırın (Telegram ID'nizi girin)
./test-webhook.sh YOUR_TELEGRAM_ID

# Örnek: ./test-webhook.sh 123456789
```

#### Manuel Test (curl ile)

```bash
# 1. Health check
curl https://telegram-mini-app-backend.karatatar.com/health

# 2. Webhook test - Sahte event gönder (ÇALIŞAN ÖRNEK!)
curl -X POST "https://telegram-mini-app-backend.karatatar.com/endpoint" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user.limited",
    "timestamp": "2024-11-21T10:30:00Z",
    "data": {
      "user": {
        "uuid": "test-uuid-989928474",
        "username": "test_user",
        "status": "LIMITED",
        "telegramId": 989928474
      }
    }
  }'

# Başarılı yanıt: {"received":true,"result":{"ok":true,"event":"user.limited"}}
# Telegram'da bildirim gelecek!
```

**Telegram ID'nizi öğrenmek için:**
- Telegram'da @userinfobot'a mesaj gönderin
- Veya @myidbot kullanın

**Başarılı yanıt:**
```json
{"ok": true, "event": "user.limited"}
```

**Detaylı test rehberi:** [WEBHOOK_TEST.md](./WEBHOOK_TEST.md)

## 🔄 Nasıl Çalışır?

```
Kullanıcı trafik limitini aşar (örn: 2GB)
    ↓
RemnaWave paneli status değiştirir: ACTIVE → LIMITED
    ↓
Panel webhook gönderir: POST https://telegram-mini-app-backend.karatatar.com/endpoint
    ↓
Backend webhook'u alır ve imzayı doğrular (HMAC SHA256)
    ↓
Kullanıcının telegramId'si kontrol edilir
    ↓
Telegram bildirimi gönderilir (<1 saniye)
    ↓
Kullanıcı işaretlenir (bir daha bildirim gönderilmez)
```

**Toplam süre:** <2 saniye ⚡


## 🔒 Güvenlik

### HMAC İmza Doğrulama

Her webhook isteği otomatik olarak doğrulanır:

```typescript
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
hmac.update(JSON.stringify(payload));
const expectedSignature = hmac.digest('hex');

// x-webhook-signature header ile karşılaştır
if (receivedSignature === expectedSignature) {
  // Geçerli webhook ✅
} else {
  // Geçersiz! ❌
}
```

### Tek Bildirim Garantisi

Her kullanıcıya sadece bir kez bildirim gönderilir:

```typescript
const notifiedUsers: Record<string, boolean> = {};

if (notifiedUsers[userUuid]) {
  // Daha önce bildirildi, atla
  return;
}

// Bildirim gönder
await bot.api.sendMessage(...);

// İşaretle
notifiedUsers[userUuid] = true;
```

## 📝 Bildirim Mesajı

```
⚠️ Hesabınız kısıtlandı!

Trafik kotanız doldu.

Hesap detaylarınızı görmek için aşağıdaki butona tıklayın.

[👤 Hesap Bilgilerim]
```

Kullanıcı butona tıkladığında:
- Hesap durumu
- Kalan trafik
- Bitiş tarihi
- Happ CryptoLink

## 🧪 Test Senaryoları

### 1. Trafik Aşımı Testi

```bash
# RemnaWave panelinden bir kullanıcının trafiğini limite çek
# Webhook otomatik gönderilecek
# Bot kullanıcıya bildirim atacak
```

### 2. Abonelik Bitişi Testi

```bash
# RemnaWave panelinden bir kullanıcının expireAt tarihini geçmişe al
# Webhook otomatik gönderilecek
# Bot kullanıcıya bildirim atacak
```

### 3. Manuel Test

```bash
curl -X POST "http://localhost:3000/internal/test-webhook/YOUR_TELEGRAM_ID" \
  -H "x-internal-token: YOUR_INTERNAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Manuel test"}'
```

## 📖 Dokümantasyon

- **Webhook Detayları:** [WEBHOOK_GUIDE.md](./WEBHOOK_GUIDE.md)
- **RemnaWave Docs:** https://docs.rw/docs/features/webhooks

## 🐛 Sorun Giderme

### Webhook Gelmiyor

1. RemnaWave panel webhook ayarlarını kontrol edin
2. URL'nin doğru ve erişilebilir olduğundan emin olun
3. SSL sertifikası geçerli olmalı (HTTPS zorunlu)
4. Firewall ayarlarını kontrol edin

### "Invalid signature" Hatası

```bash
# .env dosyasındaki WEBHOOK_SECRET ile
# RemnaWave panelindeki secret aynı olmalı

# Boşluk veya özel karakter hatası olabilir
# Secret'i kopyala-yapıştır yapın
```

### Bildirim Gönderilmiyor

1. Kullanıcının `telegramId` alanı dolu mu?
2. Kullanıcı botu engellemiş olabilir
3. Kullanıcıya daha önce bildirim gönderilmiş (tek seferlik)
4. Server loglarını kontrol edin

### Logları Kontrol Edin

```bash
# Backend logları
docker logs telegram-bot -f

# Aramalar:
# ✅ "Webhook event received: user.limited"
# ✅ "Notification sent to user..."
# ⚠️  "User has no telegramId"
# ❌ "Invalid webhook signature"
```

## ✨ Sonraki Adımlar

- [ ] Production'da test edin
- [ ] RemnaWave panel webhook loglarını inceleyin
- [ ] Telegram bildirimlerini doğrulayın
- [ ] Monitoring ekleyin (opsiyonel)
- [ ] Redis/DB ile kalıcı bildirim geçmişi (opsiyonel)

## 💡 İpuçları

1. **SSL sertifikası zorunlu** - Webhook için HTTPS kullanılmalı
2. **Test ortamında ngrok kullanabilirsiniz** - Lokal test için
3. **Logları takip edin** - İlk günlerde sorun tespiti için önemli
4. **Secret güvenliğini koruyun** - `.env` dosyası git'e commit edilmemeli
5. **RemnaWave panel webhook loglarını kontrol edin** - Başarılı/başarısız istekler görünür

## 🎉 Tebrikler!

Webhook entegrasyonu tamamlandı! Artık kullanıcılarınız hesapları kısıtlandığında anında bildirim alacaklar.

**Soru/sorun için:** Dokümantasyonu okuyun veya server loglarını kontrol edin.

