# 🎯 RemnaWave Webhook - Basit Kurulum

## ✅ RemnaWave Panelinde Sadece 2 Alan Var

### 1️⃣ URL Alanı
```
https://telegram-ts-bot-backend.karatatar.com/endpoint
```

### 2️⃣ Secret Alanı
```
9807bd3a6533bc3c72d9d67a904427811e433415de1300b8b76d80e07a8aa476a08bf2c30bc7252eb810b81fb8281de2d149b41350fbc2a17c9cc015c489498f
```

**Kaydet!**

---

## ❓ Event Seçimi Yok mu?

**Sorun değil!** Backend kodu **otomatik olarak** sadece gerekli eventleri işler:

### ✅ İşlenecek Events:
- `user.status.changed` - Kullanıcı durumu değişti
- `user.limited` - Trafik limiti aşıldı
- `user.expired` - Abonelik süresi doldu
- `user.disabled` - Kullanıcı devre dışı bırakıldı

### ❌ Atlanacak Events:
- `user.created` - Yeni kullanıcı oluşturuldu
- `user.updated` - Kullanıcı güncellendi
- Diğer tüm eventler...

RemnaWave paneli **tüm eventleri** gönderse bile, backend sadece yukarıdaki 4 event türünü işleyecek, diğerlerini otomatik atlayacak.

---

## 🔍 Nasıl Çalışıyor?

### Webhook Handler (backend/src/webhook.ts)

```typescript
// Sadece bu eventleri işle
const shouldNotify =
  eventType === 'user.status.changed' ||
  eventType === 'user.disabled' ||
  eventType === 'user.limited' ||
  eventType === 'user.expired';

if (!shouldNotify) {
  return { ok: false, reason: 'event_not_relevant' };
}

// Ayrıca kullanıcının durumu da kontrol edilir
const isRestricted =
  user.status === 'LIMITED' ||
  user.status === 'EXPIRED' ||
  user.status === 'DISABLED';

if (!isRestricted) {
  return { ok: false, reason: 'user_not_restricted' };
}
```

**İki katmanlı filtreleme:**
1. ✅ Event türü kontrol edilir
2. ✅ Kullanıcı durumu kontrol edilir

Her ikisi de geçerse → Telegram bildirimi gönderilir!

---

## 📊 Örnek Senaryolar

### ✅ Bildirim Gönderilir:
| Event | User Status | Sonuç |
|-------|-------------|-------|
| `user.limited` | `LIMITED` | ✅ Bildirim gönderilir |
| `user.expired` | `EXPIRED` | ✅ Bildirim gönderilir |
| `user.status.changed` | `LIMITED` | ✅ Bildirim gönderilir |
| `user.disabled` | `DISABLED` | ✅ Bildirim gönderilir |

### ❌ Bildirim Gönderilmez:
| Event | User Status | Sonuç | Sebep |
|-------|-------------|-------|-------|
| `user.created` | `ACTIVE` | ❌ Atlanır | Event türü uygun değil |
| `user.updated` | `ACTIVE` | ❌ Atlanır | Event türü uygun değil |
| `user.status.changed` | `ACTIVE` | ❌ Atlanır | Kullanıcı kısıtlı değil |
| `user.limited` | `ACTIVE` | ❌ Atlanır | Kullanıcı kısıtlı değil |

---

## 🎯 Özet

**RemnaWave Panelinde:**
1. URL gir
2. Secret gir
3. Kaydet

**Backend:**
- Tüm eventleri al
- Gereksiz olanları otomatik filtrele
- Sadece kısıtlanmış kullanıcılara bildirim gönder

**Sonuç:**
- ✅ Basit kurulum
- ✅ Otomatik filtreleme
- ✅ Gereksiz bildirim yok
- ✅ Sadece önemli durumlarda mesaj

---

## 🧪 Test

Webhook çalışıyor mu kontrol etmek için:

### Backend Loglarını İzleyin:
```bash
docker logs -f telegram-bot
```

### Webhook Geldiğinde Göreceğiniz Loglar:

**✅ Bildirim gönderildi:**
```
Webhook event received: user.limited
✅ Notification sent to user john_doe (123456789)
```

**❌ Event atlandı (uygun değil):**
```
Webhook event received: user.created
event_not_relevant
```

**❌ Kullanıcı kısıtlı değil:**
```
Webhook event received: user.status.changed
user_not_restricted
```

**❌ Daha önce bildirilmiş:**
```
Webhook event received: user.limited
User john_doe already notified, skipping
```

---

## 🎉 Tamamlandı!

RemnaWave panelinde sadece URL ve Secret girin. Backend gerisini halleder!

