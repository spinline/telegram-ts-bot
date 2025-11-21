# 🎯 RemnaWave Panel - Webhook Kurulumu

## ✅ Adım Adım Kurulum

### 1. RemnaWave Paneline Girin
```
https://remnawave.karatatar.com
```

### 2. Webhook Ayarlarına Gidin
```
Settings → Webhooks → Add New Webhook
```

### 3. Formu Doldurun

#### 📋 URL Alanı:
```
https://telegram-ts-bot-backend.karatatar.com/endpoint
```
**DİKKAT:** 
- ✅ Doğru: `/endpoint`
- ❌ Yanlış: `/webhook/remnawave`
- ❌ Yanlış: `/webhook`

#### 🔐 Secret Alanı:
```
9807bd3a6533bc3c72d9d67a904427811e433415de1300b8b76d80e07a8aa476a08bf2c30bc7252eb810b81fb8281de2d149b41350fbc2a17c9cc015c489498f
```
**NOT:** Bu secret `.env.production` dosyasındaki `WEBHOOK_SECRET` ile aynı olmalı!

#### 📡 Events (Olaylar):
**RemnaWave panelinde event seçimi yoksa:**
- Tüm webhook eventlerini gönderin
- Backend otomatik olarak sadece gerekli eventleri işler:
  - ✅ `user.status.changed`
  - ✅ `user.limited`
  - ✅ `user.expired`
  - ✅ `user.disabled`
- Diğer eventler (user.created, user.updated, vb.) otomatik olarak atlanır

### 4. Kaydet

"Save" veya "Create" butonuna tıklayın.

---

## 🧪 Test Etme

### Manuel Test (Backend'den)

Backend sunucunuz çalışırken terminalden:

```bash
curl -X POST "https://telegram-ts-bot-backend.karatatar.com/internal/test-webhook/YOUR_TELEGRAM_ID" \
  -H "x-internal-token: YOUR_INTERNAL_NOTIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test bildirimi"}'
```

**Not:** `YOUR_TELEGRAM_ID` yerine kendi Telegram ID'nizi yazın.

### Canlı Test (RemnaWave'den)

1. RemnaWave panelinde bir test kullanıcısı oluşturun
2. Kullanıcının trafik limitini çok düşük ayarlayın (örn: 1 MB)
3. O kullanıcı ile biraz veri kullanın
4. Limit aşıldığında Telegram'da bildirim almalısınız!

---

## 📊 Webhook Durumunu Kontrol

RemnaWave panelinde webhook'u oluşturduktan sonra:

```
Settings → Webhooks → [Webhook'unuzu seçin] → Logs
```

Burada webhook isteklerini görebilirsiniz:

### ✅ Başarılı İstek Örneği:
```
Status: 200 OK
Response Time: 156ms
Event: user.limited
```

### ❌ Başarısız İstek Örneği:
```
Status: 401 Unauthorized
Response Time: 45ms
Error: Invalid signature
```

**Çözüm:** Secret'lerin aynı olduğundan emin olun!

---

## 🔍 Sorun Giderme

### Webhook çalışmıyor?

**1. URL'i kontrol edin:**
```bash
# Doğru:
https://telegram-ts-bot-backend.karatatar.com/endpoint

# Yanlış:
https://telegram-ts-bot-backend.karatatar.com/webhook/remnawave
https://telegram-ts-bot-backend.karatatar.com/webhook
```

**2. Backend çalışıyor mu?**
```bash
curl https://telegram-ts-bot-backend.karatatar.com/health
# Yanıt: {"status":"ok","uptime":12345}
```

**3. Secret doğru mu?**
```bash
# .env.production dosyasındaki WEBHOOK_SECRET
# = 
# RemnaWave panelindeki Secret alanı

# İkisi de aynı olmalı!
```

**4. SSL var mı?**
- ✅ `https://` ile başlamalı
- ❌ `http://` çalışmaz

**5. Firewall/Güvenlik?**
RemnaWave'in backend sunucunuza erişebildiğinden emin olun.

---

## 📝 Kontrol Listesi

Webhook kurulumu tamamlandı mı?

- [ ] RemnaWave panelinde webhook oluşturuldu
- [ ] URL: `https://telegram-ts-bot-backend.karatatar.com/endpoint`
- [ ] Secret: `.env.production` ile aynı
- [ ] Backend sunucu çalışıyor
- [ ] `/health` endpoint'i 200 OK dönüyor
- [ ] Test webhook başarılı
- [ ] RemnaWave panel → Webhook Logs → İstekler gözüküyor

**NOT:** Event seçimi gerekmiyor, backend otomatik filtreleyecek!

Hepsi ✅ ise kurulum tamam! 🎉

---

## 🎯 Sonraki Adımlar

1. **Canlı Test:** Bir kullanıcının limitini aşırıp Telegram bildirimi alın
2. **Monitoring:** İlk günlerde webhook loglarını takip edin
3. **Production:** Her şey çalışıyorsa gerçek kullanıcılara açın!

---

## 💡 İpucu

RemnaWave panelinde webhook'u "Test" butonu varsa, onu kullanarak hemen test edebilirsiniz. Backend sunucu loglarında şunu göreceksiniz:

```
Webhook event received: user.limited
✅ Notification sent to user test_user (123456789)
```

Başarılar! 🚀

