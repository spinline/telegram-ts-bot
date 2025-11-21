# ⚡ Webhook Kurulum - 3 Basit Adım

## 1️⃣ Webhook Secret Oluştur

```bash
openssl rand -hex 32
```

Çıkan secret'i kopyala ve `.env.production` dosyasına yapıştır:

```bash
WEBHOOK_SECRET=burayakopyalanan_secret_yazilacak
```

## 2️⃣ RemnaWave Panelinde Webhook Ekle

RemnaWave Panel → Settings → Webhooks → Add New Webhook

📝 Formu doldur:

```
URL: https://telegram-ts-bot-backend.karatatar.com/endpoint
      ↑ Bu sizin backend sunucunuzun adresi + /endpoint

Secret: [1. adımda oluşturduğun secret]

NOT: RemnaWave panelinde event seçimi yoksa tüm eventleri gönder.
     Backend otomatik olarak sadece gerekli olanları işler:
     - user.status.changed, user.limited, user.expired, user.disabled

**Kaydet**

## 3️⃣ Test Et

```bash
# Backend sunucunuz çalışırken bu komutu çalıştırın:
curl -X POST "https://telegram-ts-bot-backend.karatatar.com/internal/test-webhook/YOUR_TELEGRAM_ID" \
  -H "x-internal-token: YOUR_INTERNAL_NOTIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test bildirimi"}'
```

Telegram'da bildirim gelirse ✅ Kurulum tamam!

---

## ❓ SSS

### Webhook URL nereden geliyor?

`.env.production` dosyasındaki `PUBLIC_BASE_URL` + `/endpoint`

```
PUBLIC_BASE_URL=https://telegram-ts-bot-backend.karatatar.com
                         ↓
Webhook URL: https://telegram-ts-bot-backend.karatatar.com/endpoint
```

### Secret nerede kullanılacak?

İki yerde:
1. `.env.production` dosyasında: `WEBHOOK_SECRET=xxx`
2. RemnaWave panelinde: Secret alanına aynı değer

İkisi **AYNI** olmalı!

### Nasıl çalıştığını görebilir miyim?

Evet! Backend sunucu loglarını izleyin:

```bash
# Docker kullanıyorsanız
docker logs -f telegram-bot

# Normal çalıştırıyorsanız
# Terminal'de göreceksiniz
```

Kullanıcı durumu değiştiğinde şöyle loglar göreceksiniz:

```
Webhook event received: user.limited
✅ Notification sent to user john_doe (123456789)
```

### Çalışmazsa?

1. **Backend çalışıyor mu?** → `curl https://telegram-ts-bot-backend.karatatar.com/health`
2. **Secret doğru mu?** → .env ve panel'de aynı olmalı
3. **URL doğru mu?** → `/webhook/remnawave` sonunda olmalı
4. **SSL var mı?** → HTTPS olmalı (HTTP olmaz)
5. **Logları kontrol et** → Hata mesajlarını göreceksin

---

## 🎉 Tamamlandı!

Artık sistem çalışıyor. Kullanıcı trafiği aştığında veya aboneliği bittiğinde otomatik olarak Telegram bildirimi alacak.

**Test için:** RemnaWave panelinden bir test kullanıcısının trafiğini limite çekin ve webhook'un çalıştığını görün!

