# Backend Deployment Guide

## Sunucuda İlk Kurulum

```bash
# Repo'yu clone edin
git clone https://github.com/spinline/telegram-ts-bot.git
cd telegram-ts-bot/backend

# Bağımlılıkları yükleyin
npm ci
```

## Environment Variables (.env)

`.env` dosyası oluşturun ve aşağıdaki değerleri doldurun:

```bash
# API Credentials
API_BASE_URL=https://remnawave.karatatar.com
API_TOKEN=your_api_token_here

# Telegram Bot
BOT_TOKEN=your_bot_token_here

# Mini App URL (HTTPS zorunlu!)
MINI_APP_URL=https://telegram-mini-app-frontend.karatatar.com

# Internal Squad UUID (API'den alın)
INTERNAL_SQUAD_UUID=your_squad_uuid_here

# Server Port
PORT=3000

# (Opsiyonel) Public URL
PUBLIC_BASE_URL=https://your-public-url.com
```

### Environment Variables Nasıl Alınır?

**API_TOKEN**: API yönetim panelinden "API Token" oluşturun.

**INTERNAL_SQUAD_UUID**: Aşağıdaki komutu çalıştırın:
```bash
curl -s -H "Authorization: Bearer YOUR_API_TOKEN" \
  "https://remnawave.karatatar.com/api/internal-squads" | jq '.response.internalSquads[0].uuid'
```

**BOT_TOKEN**: Telegram'da @BotFather ile bot oluşturun ve token'ı alın.

## Build ve Deployment

```bash
# 1. En son kodu çekin
git pull

# 2. Bağımlılıkları güncelleyin
npm ci

# 3. TypeScript'i derleyin
npm run build

# 4. Eski process'leri durdurun
pkill -f "node dist/index.js" || true

# 5. Production modunda başlatın
NODE_ENV=production node dist/index.js
```

## PM2 ile Otomatik Başlatma (Önerilen)

```bash
# PM2 yükleyin (global)
npm install -g pm2

# Botu başlatın
pm2 start dist/index.js --name telegram-bot

# Logları görüntüleyin
pm2 logs telegram-bot

# Sunucu yeniden başlatıldığında otomatik başlat
pm2 startup
pm2 save
```

## Güncelleme Sonrası

```bash
cd telegram-ts-bot/backend
git pull
npm ci
npm run build
pm2 restart telegram-bot
```

## Sorun Giderme

### A018 Hatası Alıyorum

1. **API Token'ı kontrol edin:**
```bash
grep API_TOKEN .env
```

2. **Squad UUID'yi doğrulayın:**
```bash
export $(cat .env | xargs)
curl -s -H "Authorization: Bearer $API_TOKEN" \
  "$API_BASE_URL/api/internal-squads" | jq '.response.internalSquads[] | {uuid, name}'
```

3. **Build'in güncel olduğundan emin olun:**
```bash
npm run build
pm2 restart telegram-bot  # veya: node dist/index.js
```

4. **Logları inceleyin:**
```bash
pm2 logs telegram-bot --lines 100
# veya direkt çalıştırıyorsanız terminal çıktısını kontrol edin
```

Loglarda şunları aramalısınız:
- `"Validated internal squad: ..."` - Squad doğrulaması başarılı mı?
- `"Creating user with data: ..."` - Hangi payload gönderiliyor?
- `"Failed to create user:"` - API'den gelen tam hata mesajı

### 409 Conflict Hatası

Birden fazla bot instance çalışıyor. Hepsini durdurun:
```bash
pkill -f "node dist/index.js"
pkill -f "ts-node"
pm2 delete all
```

Sonra tek bir instance başlatın.

### Bot Yanıt Vermiyor

Webhook'u temizleyin:
```bash
curl "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook"
```

## Loglar ve İzleme

PM2 ile:
```bash
# Canlı loglar
pm2 logs telegram-bot

# Son 100 satır
pm2 logs telegram-bot --lines 100

# Hata logları
pm2 logs telegram-bot --err

# Bot durumu
pm2 status
```

## Test

Manual kullanıcı oluşturma testi:
```bash
export $(cat .env | xargs)

curl -X POST "$API_BASE_URL/api/users" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test'$(date +%s)'",
    "expireAt": "'$(date -u -d '+3 days' +'%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || python3 -c 'from datetime import datetime,timedelta; print((datetime.utcnow()+timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%SZ"))')'",
    "trafficLimitBytes": 2147483648,
    "trafficLimitStrategy": "NO_RESET",
    "activeInternalSquads": ["'$INTERNAL_SQUAD_UUID'"],
    "tag": "TRIAL"
  }' | jq .
```

Başarılı olursa API token ve squad UUID doğrudur.
