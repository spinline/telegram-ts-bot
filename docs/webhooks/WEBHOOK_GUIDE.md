# Webhook Entegrasyonu - RemnaWave

## Genel Bakış

Webhook kullanarak gerçek zamanlı bildirimler alın. Kullanıcı hesabı kısıtlandığında (trafik aşımı, abonelik bitişi) RemnaWave paneli otomatik olarak webhook'u tetikler ve bot anında kullanıcıya bildirim gönderir.

## Avantajlar

✅ **Gerçek Zamanlı** - Olay gerçekleştiğinde hemen bildirim  
✅ **Düşük Kaynak Kullanımı** - Periyodik API kontrolüne gerek yok  
✅ **Güvenli** - HMAC SHA256 imza doğrulama  
✅ **Tek Bildirim** - Her kullanıcıya sadece bir kez mesaj

## Kurulum

### 1. Webhook Secret Oluşturun

Güçlü bir rastgele string oluşturun:
```bash
openssl rand -hex 32
```

`.env.production` dosyasına ekleyin:
```bash
WEBHOOK_SECRET=your_generated_secret_here
```

### 2. RemnaWave Panelinde Webhook Ayarlayın

RemnaWave panel ayarlarına gidin ve webhook ekleyin:

**Webhook URL:**
```
https://your-domain.com/endpoint
```

**Secret/Signing Key:**
```
your_generated_secret_here
```

**NOT:** RemnaWave panelinde event seçimi yoksa, tüm eventleri gönderin.  
Backend otomatik olarak sadece aşağıdaki eventleri işler:
- `user.status.changed`
- `user.disabled`
- `user.limited`
- `user.expired`

Diğer eventler (user.created, user.updated, vb.) otomatik olarak atlanır.

### 3. Notifier'ı Kapatın (Opsiyonel)

Webhook kullanıyorsanız periyodik kontrole gerek yok:
```bash
NOTIFY_INTERVAL_MS=0
```

## Webhook Event Formatı

RemnaWave paneli aşağıdaki formatta webhook gönderir:

```json
{
  "event": "user.status.changed",
  "timestamp": "2024-11-21T10:30:00Z",
  "data": {
    "user": {
      "uuid": "user-uuid-here",
      "username": "john_doe",
      "status": "LIMITED",
      "telegramId": 123456789,
      "usedTrafficBytes": 2147483648,
      "trafficLimitBytes": 2147483648,
      "expireAt": "2024-12-01T00:00:00Z"
    }
  }
}
```

## Desteklenen Event Türleri

| Event | Açıklama | Bildirim Gönderilir mi? |
|-------|----------|-------------------------|
| `user.status.changed` | Kullanıcı durumu değişti | ✅ Evet (LIMITED/EXPIRED/DISABLED ise) |
| `user.disabled` | Kullanıcı devre dışı | ✅ Evet |
| `user.limited` | Trafik kotası doldu | ✅ Evet |
| `user.expired` | Abonelik süresi bitti | ✅ Evet |
| `user.created` | Yeni kullanıcı | ❌ Hayır |
| `user.updated` | Kullanıcı güncellendi | ❌ Hayır |

## Güvenlik

### İmza Doğrulama

Her webhook isteği `x-webhook-signature` header'ı ile gelir:

```
x-webhook-signature: a1b2c3d4e5f6...
```

Sistem otomatik olarak HMAC SHA256 ile imzayı doğrular:

```typescript
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
hmac.update(JSON.stringify(payload));
const expectedSignature = hmac.digest('hex');

if (receivedSignature === expectedSignature) {
  // Geçerli webhook
}
```

### IP Whitelist (Opsiyonel)

RemnaWave panelinin IP adreslerini middleware ile kontrol edebilirsiniz:

```typescript
const ALLOWED_IPS = ['1.2.3.4', '5.6.7.8'];

app.use('/webhook/remnawave', (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  if (!ALLOWED_IPS.includes(clientIP)) {
    return res.status(403).json({ error: 'Forbidden IP' });
  }
  next();
});
```

## Test

### Manuel Webhook Testi

```bash
# Webhook endpoint'ini test edin
curl -X POST "https://your-domain.com/endpoint" \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: test_signature" \
  -d '{
    "event": "user.limited",
    "timestamp": "2024-11-21T10:30:00Z",
    "data": {
      "user": {
        "uuid": "test-uuid",
        "username": "test_user",
        "status": "LIMITED",
        "telegramId": 123456789
      }
    }
  }'
```

### Başarılı Yanıt

```json
{
  "received": true,
  "result": {
    "ok": true,
    "event": "user.limited"
  }
}
```

### Hata Yanıtları

**Geçersiz İmza:**
```json
{
  "error": "Invalid signature"
}
```

**Telegram ID Yok:**
```json
{
  "received": true,
  "result": {
    "ok": false,
    "reason": "no_telegram_id"
  }
}
```

**Daha Önce Bildirilmiş:**
```json
{
  "received": true,
  "result": {
    "ok": false,
    "reason": "already_notified"
  }
}
```

## Monitoring

### Webhook Logları

Sistem otomatik olarak webhook olaylarını loglar:

```
✅ Webhook event received: user.limited
✅ Notification sent to user test_user (123456789)
⚠️  User test_user has no telegramId, skipping notification
❌ Webhook error: Invalid signature
```

### Health Check

Webhook endpoint'inin çalıştığını kontrol edin:

```bash
curl https://your-domain.com/health
```

## Sorun Giderme

### Webhook Gelmiyor

1. RemnaWave panel webhook ayarlarını kontrol edin
2. URL'nin doğru olduğundan emin olun (https://...)
3. Firewall/güvenlik duvarı ayarlarını kontrol edin
4. Server loglarını inceleyin

### "Invalid signature" Hatası

1. `.env.production` dosyasındaki `WEBHOOK_SECRET` değerini kontrol edin
2. RemnaWave panelindeki secret ile aynı olmalı
3. Boşluk veya özel karakter hatası olabilir

### Bildirim Gönderilmiyor

1. Kullanıcının `telegramId` alanının dolu olduğundan emin olun
2. Kullanıcı botu engellemiş olabilir
3. Kullanıcıya daha önce bildirim gönderilmiş olabilir (tek seferlik)
4. Event türünün desteklenen listede olduğunu kontrol edin

### Webhook Çok Geliyor

### Kullanıcı durumunu kontrol edin

Bildirim sadece kullanıcı kısıtlı durumdaysa gönderilir:
- `status === 'LIMITED'`
- `status === 'EXPIRED'`
- `status === 'DISABLED'`
RemnaWave panelinde sadece gerekli event'leri seçin:
- ✅ `user.status.changed`
- ✅ `user.limited`
- ✅ `user.expired`
- ✅ `user.disabled`
- ❌ `user.created` (gereksiz)
- ❌ `user.updated` (gereksiz)
Eğer `status === 'ACTIVE'` ise bildirim gönderilmez.
## Performans
| CPU Kullanımı | Minimal |
| API İstekleri | 0 (sadece webhook) |
| Gerçek Zamanlı | ✅ Evet |
| Kurulum | Orta |

**Avantaj:** Webhook kullanarak gerçek zamanlı, düşük kaynak kullanımlı bildirimler alırsınız.

## İleri Seviye

### Webhook Retry Mekanizması

RemnaWave webhook başarısız olursa otomatik retry yapar. Eğer kendi retry mekanizmanızı eklemek isterseniz:

```typescript
// webhook.ts içine ekleyin
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

async function handleWebhookWithRetry(bot: Bot, event: WebhookEvent, retryCount = 0) {
  try {
    return await handleWebhook(bot, event);
  } catch (e) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return handleWebhookWithRetry(bot, event, retryCount + 1);
    }
    throw e;
  }
}
```

### Webhook Event Kuyruğu

Yüksek trafik için Redis/RabbitMQ kullanabilirsiniz:

```typescript
import Queue from 'bull';

const webhookQueue = new Queue('webhooks', process.env.REDIS_URL);

webhookQueue.process(async (job) => {
  const { bot, event } = job.data;
  return handleWebhook(bot, event);
});

// Webhook endpoint'inde
app.post('/webhook/remnawave', async (req, res) => {
  // ... doğrulama ...
  await webhookQueue.add({ bot, event: req.body });
  res.json({ received: true, queued: true });
});
```

## Örnek Senaryo

1. Kullanıcı John'un trafiği 2GB limitini aşar
2. RemnaWave paneli durumu `ACTIVE` → `LIMITED` değiştirir
3. Panel webhook gönderir: `user.status.changed`
4. Backend webhook'u alır ve imzayı doğrular
5. John'un Telegram ID'si bulunur
6. Bot John'a bildirim gönderir: "⚠️ Hesabınız kısıtlandı! Trafik kotanız doldu."
7. John "Hesap Bilgilerim" butonuna tıklar
8. Hesap detayları gösterilir
9. Sistem John'u işaretler (bir daha bildirim gönderilmez)

**Toplam süre:** <2 saniye (gerçek zamanlı!)

## Destek

Sorun yaşarsanız:
1. Server loglarını kontrol edin
2. RemnaWave webhook loglarını kontrol edin
3. Test endpoint'i ile manuel test yapın
4. Dokümantasyonu okuyun: https://docs.rw/docs/features/webhooks

