# 🧪 Webhook Test Rehberi

## Bildirim Gelmeme Sebepleri ve Çözümleri

### 1️⃣ Backend Çalışıyor mu?

```bash
# Health check
curl https://telegram-ts-bot-backend.karatatar.com/health

# Beklenen: {"status":"ok","uptime":123}
```

**Sorun varsa:**
- Backend servisi çalışmıyor olabilir
- `docker ps` veya `pm2 list` ile kontrol edin
- Servisi restart edin

---

## 🔧 Test Yöntemleri

### Test 1: Internal Test Endpoint (En Kolay)

Backend'de özel bir test endpoint'i var. Direkt Telegram ID'nize bildirim gönderir:

```bash
# Telegram ID'nizi öğrenin: @userinfobot'a mesaj gönderin

# Test komutu
curl -X POST "https://telegram-ts-bot-backend.karatatar.com/internal/test-webhook/YOUR_TELEGRAM_ID" \
  -H "x-internal-token: 54112d9f74ff1372f2cc4b91b295ad8678411effb497c889836697838d0b30a6" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test bildirimi - webhook çalışıyor mu?"}'
```

**Örnek (Telegram ID: 123456789):**
```bash
curl -X POST "https://telegram-ts-bot-backend.karatatar.com/internal/test-webhook/123456789" \
  -H "x-internal-token: 54112d9f74ff1372f2cc4b91b295ad8678411effb497c889836697838d0b30a6" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test bildirimi - sistem çalışıyor!"}'
```

**Başarılı yanıt:**
```json
{
  "ok": true,
  "event": "user.limited"
}
```

**Hata yanıtları:**
```json
// Kullanıcı bulunamadı
{"error": "User not found"}

// Daha önce bildirim gönderilmiş
{"ok": false, "reason": "already_notified"}

// Telegram ID yok
{"ok": false, "reason": "no_telegram_id"}
```

---

### Test 2: Sahte Webhook Gönder

RemnaWave webhook simülasyonu:

```bash
curl -X POST "https://telegram-ts-bot-backend.karatatar.com/endpoint" \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: FAKE_SIGNATURE" \
  -d '{
    "event": "user.limited",
    "timestamp": "2024-11-21T10:30:00Z",
    "data": {
      "user": {
        "uuid": "test-uuid-123",
        "username": "test_user",
        "status": "LIMITED",
        "telegramId": YOUR_TELEGRAM_ID
      }
    }
  }'
```

**Not:** Signature doğrulaması başarısız olacak ama backend log'larında göreceksiniz.

---

### Test 3: RemnaWave Panelinden Webhook Test

1. RemnaWave panel → Settings → Webhooks
2. Webhook'unuzu bulun
3. "Test" veya "Send Test Event" butonuna tıklayın
4. Backend log'larını izleyin

---

## 🔍 Sorun Tespiti

### Adım 1: Telegram ID Kontrolü

Kullanıcınızın Telegram ID'si var mı?

```bash
# RemnaWave API'den kullanıcıyı kontrol edin
curl -X GET "https://remnawave.karatatar.com/api/users?username=TEST_USERNAME" \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# telegramId alanına bakın
```

**Sorun:** `telegramId` null veya boş
**Çözüm:** Kullanıcı botu /start ile başlatmalı

---

### Adım 2: Backend Log Kontrolü

```bash
# Docker kullanıyorsanız
docker logs -f telegram-bot --tail 100

# PM2 kullanıyorsanız
pm2 logs telegram-bot --lines 100

# Systemd kullanıyorsanız
journalctl -u telegram-bot -f
```

**Aranacak loglar:**
```
✅ "Webhook event received: user.limited"
✅ "Notification sent to user john_doe (123456789)"
⚠️  "User has no telegramId, skipping notification"
⚠️  "User already notified, skipping"
❌ "Invalid webhook signature"
❌ "Failed sending notify to 123456789"
```

---

### Adım 3: Webhook Secret Kontrolü

Backend `.env.production` ile RemnaWave panel secret'ları aynı mı?

```bash
# Backend sunucuda
cat /path/to/backend/.env.production | grep WEBHOOK_SECRET

# Çıktı: WEBHOOK_SECRET=e38068b41c6a516abb9048c469a3a94d...
```

**RemnaWave panelde:**
- Settings → Webhooks → Secret alanı
- Aynı değer olmalı!

---

### Adım 4: Kullanıcı Botu Engellemiş mi?

Telegram API hatası: `403 Forbidden: bot was blocked by the user`

**Çözüm:**
1. Kullanıcıya Telegram'dan botunuzu açmasını söyleyin
2. `/start` komutu göndermesini isteyin
3. Tekrar deneyin

---

## 📋 Checklist: Bildirim Gelmiyorsa

- [ ] Backend servisi çalışıyor mu? (`/health` OK?)
- [ ] RemnaWave webhook eklenmiş mi?
- [ ] Webhook URL doğru mu? (`/endpoint`)
- [ ] Webhook secret doğru mu?
- [ ] Kullanıcının Telegram ID'si var mı?
- [ ] Kullanıcı botu başlatmış mı? (`/start`)
- [ ] Kullanıcı botu engellemiş mi?
- [ ] Kullanıcının durumu kısıtlı mı? (LIMITED/EXPIRED/DISABLED)
- [ ] Daha önce bildirim gönderilmemiş mi?

---

## 🎯 Hızlı Test Senaryosu

### Senaryo: Trafik Aşımı Testi

1. **RemnaWave panelde test kullanıcısı oluşturun:**
   - Username: `test_webhook_user`
   - Telegram ID: Kendi Telegram ID'niz
   - Traffic Limit: 1 MB (çok düşük)

2. **Botu başlatın:**
   - Telegram'da botunuza `/start` gönderin

3. **Trafiği aşın:**
   - RemnaWave panelde kullanıcının traffic'ini manuel artırın
   - Veya VPN ile biraz veri kullanın

4. **Bildirim gelmeli!**
   - ⚠️ Hesabınız kısıtlandı!
   - Trafik kotanız doldu.

---

## 🛠️ Debug Modu

Backend'i debug modu ile çalıştırın:

```bash
# .env.production dosyasına ekleyin
NODE_ENV=development
DEBUG=*

# Restart
pm2 restart telegram-bot
```

Daha detaylı log'lar göreceksiniz.

---

## 📞 Acil Test Komutu

Hemen test etmek için (kendi Telegram ID'nizi kullanın):

```bash
# 1. Telegram ID'nizi öğrenin
# Telegram'da @userinfobot'a mesaj gönderin

# 2. Bu komutu çalıştırın (ID'nizi değiştirin)
curl -X POST "https://telegram-ts-bot-backend.karatatar.com/internal/test-webhook/YOUR_TELEGRAM_ID" \
  -H "x-internal-token: 54112d9f74ff1372f2cc4b91b295ad8678411effb497c889836697838d0b30a6" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Acil test - webhook çalışıyor mu?"}'

# 3. Telegram'da bildirim geldi mi?
```

**✅ Bildirim geldiyse:** Webhook çalışıyor! RemnaWave entegrasyonunu kontrol edin.

**❌ Bildirim gelmediyse:** Backend çalışmıyor veya bot token'ı yanlış.

---

## 💡 Son Çare

Hiçbir şey çalışmazsa:

1. **Backend'i restart edin:**
   ```bash
   pm2 restart telegram-bot
   # veya
   docker-compose restart backend
   ```

2. **Yeni secret oluşturun:**
   ```bash
   openssl rand -hex 64
   ```

3. **Backend ve RemnaWave'de güncelleyin**

4. **Tekrar test edin**

---

## 🎉 Test Başarılı!

Bildirim geldiyse sistem çalışıyor demektir. Artık gerçek kullanıcılar için otomatik bildirimler aktif!

