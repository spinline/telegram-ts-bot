# 🐛 RemnaWave Webhook Debug Rehberi

## ❓ Sorun: Panel'de kısıtlama yapıldığında bildirim gelmiyor

Curl ile test çalışıyor ama RemnaWave panelden gerçek kısıtlama yapıldığında bildirim gelmiyor.

---

## 🔍 Debug Adımları

### 1. Backend Log'larını İzleyin

```bash
# Docker
docker logs -f telegram-bot

# PM2
pm2 logs telegram-bot --lines 200

# Systemd
journalctl -u telegram-bot -f -n 200
```

### 2. RemnaWave'den Bir Kullanıcıyı Kısıtlayın

RemnaWave panelde:
1. Bir kullanıcı seçin
2. Traffic limitini çok düşük yapın (örn: 1 MB)
3. Veya manuel olarak status'u LIMITED'a çevirin
4. Kaydedin

### 3. Log'larda Şunları Arayın

**✅ Webhook Geldi:**
```
=== WEBHOOK RECEIVED ===
Headers: {...}
Body: {...}
📡 Webhook event type: user.limited
```

**❌ Webhook Gelmedi:**
- Backend log'larında hiçbir şey yok
- RemnaWave webhook ayarlarını kontrol edin

**⚠️ Signature Hatası:**
```
⚠️ Invalid webhook signature - rejecting request
```
→ Secret'lar eşleşmiyor

**⚠️ Telegram ID Yok:**
```
⚠️ User john_doe has no telegramId, skipping notification
```
→ Kullanıcı botu başlatmamış

---

## 🔧 Olası Sorunlar ve Çözümler

### Sorun 1: Webhook Hiç Gelmiyor

**Kontrol:**
```bash
# RemnaWave .env dosyasında
WEBHOOK_ENABLED=true  # ✅ Olmalı
WEBHOOK_URL=https://telegram-mini-app-backend.karatatar.com/endpoint  # ✅ Doğru URL
```

**Test:**
```bash
# RemnaWave sunucusundan backend'e erişebiliyor mu?
curl https://telegram-mini-app-backend.karatatar.com/health
```

**Çözüm:**
- Firewall kurallarını kontrol edin
- RemnaWave sunucusu backend'e erişebilmeli
- SSL sertifikası geçerli olmalı (HTTPS)

---

### Sorun 2: "Invalid webhook signature"

**Kontrol:**
```bash
# Backend .env.production
WEBHOOK_SECRET=e38068b41c6a516abb9048c469a3a94d...

# RemnaWave .env
WEBHOOK_SECRET_HEADER=e38068b41c6a516abb9048c469a3a94d...
```

**İkisi AYNI olmalı!**

**Log'larda göreceksiniz:**
```
🔐 Signature verification:
   Expected: abc123...
   Received: xyz789...
   Match: false
```

**Çözüm:**
1. RemnaWave .env'de WEBHOOK_SECRET_HEADER kontrol edin
2. Backend .env.production'da WEBHOOK_SECRET kontrol edin
3. İkisini aynı yapın
4. Her iki servisi de restart edin

---

### Sorun 3: Kullanıcının Telegram ID'si Yok

**Log'da:**
```
⚠️ User john_doe has no telegramId, skipping notification
```

**Sebep:**
- Kullanıcı Telegram botunu başlatmamış
- RemnaWave'de telegramId alanı boş

**Çözüm:**
1. Kullanıcıya Telegram'da botu bulmasını söyleyin
2. `/start` komutunu göndermesini isteyin
3. RemnaWave API'de telegramId güncellenecek

---

### Sorun 4: Event Türü Uygun Değil

**Log'da:**
```
🔔 Should notify? false (event type: user.created)
⏭️ Event not relevant for notifications
```

**Sebep:**
RemnaWave farklı bir event gönderiyor (örn: user.created, user.updated)

**Kabul edilen event'ler:**
- `user.status.changed` (LIMITED/EXPIRED/DISABLED olduğunda)
- `user.limited`
- `user.expired`
- `user.disabled`

**Çözüm:**
- Normal davranış, sorun yok
- Sadece kısıtlama event'lerinde bildirim gönderilir

---

### Sorun 5: Kullanıcı Kısıtlı Değil

**Log'da:**
```
🚫 User restricted? false (status: ACTIVE)
✅ User not restricted, skipping notification
```

**Sebep:**
- User status'u hala ACTIVE
- RemnaWave henüz status'u değiştirmemiş

**Çözüm:**
- RemnaWave panelde kullanıcının status'unu manuel LIMITED yapın
- Veya trafiği gerçekten limite çekin

---

### Sorun 6: Daha Önce Bildirim Gönderilmiş

**Log'da:**
```
⏭️ User john_doe already notified, skipping
```

**Sebep:**
- Sistemi test ederken aynı kullanıcıya tekrar bildirim göndermeye çalışıyorsunuz
- Her kullanıcıya SADECE BİR KEZ bildirim gönderilir

**Çözüm:**
Backend'i restart edin:
```bash
# Docker
docker-compose restart backend

# PM2
pm2 restart telegram-bot
```

Bellek temizlenecek ve tekrar bildirim gönderebilirsiniz.

---

## 📝 Test Senaryosu

### Adım Adım Test

**1. Temiz Başlangıç**
```bash
# Backend'i restart edin (hafızayı temizler)
pm2 restart telegram-bot

# Log'ları izlemeye başlayın
pm2 logs telegram-bot
```

**2. Test Kullanıcısı Hazırlayın**
- RemnaWave panelde yeni bir kullanıcı oluşturun
- Telegram ID: 989928474 (veya kendi ID'niz)
- Traffic Limit: 1 MB (çok düşük)

**3. Botu Başlatın**
- Telegram'da botunuza `/start` gönderin
- Bu, telegramId'yi kaydeder

**4. Trafiği Aşın**
- RemnaWave panelde kullanıcının traffic'ini manuel 2 MB yapın
- Veya VPN ile biraz veri kullanın

**5. Log'ları Kontrol Edin**

**Başarılı senaryo:**
```
=== WEBHOOK RECEIVED ===
📡 Webhook event type: user.limited
🔍 Processing webhook event: user.limited
👤 User data: {username: "test_user", status: "LIMITED", telegramId: 989928474}
🔔 Should notify? true
🚫 User restricted? true (status: LIMITED)
📤 Sending notification to Telegram ID: 989928474
✅ Notification sent successfully to user test_user (989928474)
```

**6. Telegram'ı Kontrol Edin**
Bildirim geldi mi?

---

## 🔍 Detaylı Log Analizi

### Log Seviyelerine Göre Kontroller

#### Seviye 1: Webhook Alındı mı?
```
=== WEBHOOK RECEIVED ===
```
❌ Yok → RemnaWave webhook göndermemiş
✅ Var → İyi, devam

#### Seviye 2: Headers Doğru mu?
```
Headers: {
  "x-webhook-signature": "abc123..."
}
```
❌ signature yok → Secret ayarlanmamış
✅ signature var → İyi, devam

#### Seviye 3: Signature Geçerli mi?
```
🔐 Signature verification:
   Match: true
```
❌ false → Secret'lar farklı
✅ true → İyi, devam

#### Seviye 4: Event İşleniyor mu?
```
🔍 Processing webhook event: user.limited
```
✅ Görülüyor → İyi, devam

#### Seviye 5: Telegram ID Var mı?
```
📱 Telegram ID: 989928474
```
❌ null/undefined → Kullanıcı botu başlatmamış
✅ Sayı → İyi, devam

#### Seviye 6: Bildirim Gönderildi mi?
```
✅ Notification sent successfully
```
✅ Görülüyor → BAŞARILI!

---

## 🛠️ Acil Düzeltmeler

### Hızlı Fix 1: Signature Doğrulamayı Geçici Kapat

**SADECE TEST İÇİN!**

`backend/src/index.ts` içinde:
```typescript
// Signature doğrulamayı geçici olarak devre dışı bırak
if (false && webhookSecret && signature) {  // false ekle
  // ...signature validation...
}
```

Eğer bundan sonra bildirim geliyorsa → Sorun signature'da.

### Hızlı Fix 2: Tek Seferlik Kontrolü Kapat

**TEST İÇİN!**

`backend/src/webhook.ts` içinde:
```typescript
// Bu kontrolü yoruma al
/*
if (notifiedUsers[userUuid]) {
  return { ok: false, reason: 'already_notified' };
}
*/
```

Şimdi her defasında bildirim gönderir.

---

## 📊 Checklist

RemnaWave panelden kısıtlama yapınca bildirim gelmiyorsa:

- [ ] Backend çalışıyor mu? (`/health` OK?)
- [ ] RemnaWave WEBHOOK_ENABLED=true mu?
- [ ] WEBHOOK_URL doğru mu?
- [ ] Secret'lar eşleşiyor mu? (RemnaWave vs Backend)
- [ ] Backend log'larında webhook görünüyor mu?
- [ ] Signature validation geçiyor mu?
- [ ] Event türü doğru mu? (limited/expired/disabled)
- [ ] Kullanıcının telegramId'si var mı?
- [ ] Kullanıcı status'u kısıtlı mı? (LIMITED/EXPIRED/DISABLED)
- [ ] Daha önce bildirim gönderilmemiş mi?
- [ ] Telegram ID doğru mu?
- [ ] Kullanıcı botu engellemiş mi?

---

## 💡 İpuçları

1. **Her zaman log'ları izleyin**
   ```bash
   pm2 logs telegram-bot --lines 500
   ```

2. **RemnaWave webhook log'larını kontrol edin**
   - RemnaWave admin panelde webhook geçmişi olabilir

3. **Test kullanıcısı kullanın**
   - Gerçek kullanıcılarla test etmeyin
   - Ayrı bir test kullanıcısı oluşturun

4. **Backend'i sık restart edin**
   - Hafızayı temizler (notifiedUsers)
   - Kod değişiklikleri yüklenir

5. **Curl test ile karşılaştırın**
   - Curl çalışıyor ama RemnaWave çalışmıyorsa
   - Sorun muhtemelen signature'dadır

---

## 🎯 Sonraki Adımlar

1. Backend'i restart edin
2. Log'ları izleyin
3. RemnaWave'den bir kullanıcıyı kısıtlayın
4. Log çıktısını buraya yapıştırın

Hangi seviyede hata olduğunu tespit edip düzeltelim!

