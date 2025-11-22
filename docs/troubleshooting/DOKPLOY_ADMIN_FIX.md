# 🚨 DOKPLOY DEPLOYMENT REHBERİ

## Sorun

`/start` çalışıyor ama `/admin` hiç yanıt vermiyor ve log'larda da birşey yok.

**Sebep:** Dokploy'da eski kod hala çalışıyor, yeni kod deploy edilmemiş.

---

## ✅ Çözüm: Adım Adım Deployment

### 1. Environment Variables Ekleyin (ÖNEMLİ!)

Dokploy panelinde:

1. **Projenizi seçin** → `telegram-ts-bot-backend`
2. **Settings** sekmesine gidin
3. **Environment Variables** bölümünü bulun
4. **Add Variable** tıklayın

**Eklenecek değişken:**
```
Name:  ADMIN_TELEGRAM_IDS
Value: 989928474
```

5. **Save** tıklayın

### 2. Rebuild & Redeploy

#### Seçenek A: UI'dan (Kolay)

1. **Deployments** sekmesine gidin
2. **Rebuild** butonuna tıklayın
3. Build tamamlanınca **Deploy** butonuna tıklayın

#### Seçenek B: Git Push (Otomatik)

```bash
# Zaten yaptık, sadece Dokploy'un pull etmesi lazım
# Dokploy otomatik deploy ediyorsa bu yeterli
```

### 3. Container'ı Restart Edin

1. **Overview** sekmesine gidin
2. **Restart** butonuna tıklayın

### 4. Logs'u İzleyin

1. **Logs** sekmesine gidin
2. **Real-time logs** açın

**Görmeli:**
```
✅ Bot @your_bot is running!
📱 Commands: /start, /admin, /help, /app
⚡ RemnaWave webhook: POST /endpoint
API server listening on port 3000
```

---

## 🔍 Environment Variables Kontrolü

Dokploy Settings → Environment Variables'da **mutlaka olması gerekenler:**

```bash
API_BASE_URL=https://remnawave.karatatar.com
API_TOKEN=eyJ... (RemnaWave API token)
BOT_TOKEN=8410224035:AAG... (Telegram bot token)
MINI_APP_URL=https://telegram-mini-app-frontend.karatatar.com
INTERNAL_SQUAD_UUID=b9bbdfd4-e63b-4ba7-8a72-d036710d17d8
PORT=3000
PUBLIC_BASE_URL=https://telegram-mini-app-backend.karatatar.com
WEBHOOK_SECRET=e38068b41c6a516abb... (64 karakter)
INTERNAL_NOTIFY_TOKEN=54112d9f74ff... (64 karakter)

# YENİ - BUNU EKLEYİN! ⬇️
ADMIN_TELEGRAM_IDS=989928474
```

---

## 📱 Test Adımları

### 1. Bot Çalışıyor mu?

Telegram'da:
```
/start
```

✅ Yanıt geliyorsa bot çalışıyor.

### 2. Admin Komutu

Telegram'da:
```
/admin
```

**Beklenen yanıt:**
```
👨‍💼 Admin Paneli

Yönetim fonksiyonlarını seçin:

[👥 Kullanıcı Listesi] [🔍 Kullanıcı Ara]
[📢 Toplu Bildirim] [📊 İstatistikler]
...
```

**Eğer yanıt gelmezse:**

#### A) Log'larda "🔍 /admin komutu çalıştırıldı" VAR mı?

**VAR:**
```
🔍 /admin komutu çalıştırıldı
   Telegram ID: 989928474
   ADMIN_TELEGRAM_IDS env: undefined ❌
```
→ Environment variable eklenmemiş! Adım 1'e dön.

**YOK:**
```
(Log'da hiçbir şey yok)
```
→ Eski kod çalışıyor! Rebuild + Restart yapın.

#### B) "Is admin? false" diyor mu?

```
   Is admin? false
   ❌ Yetki yok
```
→ Telegram ID'niz yanlış veya environment variable'da farklı.

**Çözüm:**
1. @userinfobot'tan ID'nizi kontrol edin
2. Environment variable'daki değeri güncelleyin
3. Restart edin

---

## 🐛 Troubleshooting

### Sorun 1: Environment Variable Görünmüyor

**Kontrol:**
Dokploy Logs'ta şunu arayın:
```
ADMIN_TELEGRAM_IDS env: undefined
```

**Çözüm:**
1. Settings → Environment Variables
2. `ADMIN_TELEGRAM_IDS` var mı kontrol edin
3. Yoksa ekleyin: `989928474`
4. Save → Restart

### Sorun 2: Rebuild Çalışmıyor

**Kontrol:**
Dokploy Logs'ta build hatası var mı?

**Çözüm:**
1. Clean Cache (yaptınız ✅)
2. Rebuild
3. Eğer hata varsa log'ları paylaşın

### Sorun 3: Bot Crash Oluyor

**Kontrol:**
Logs'ta hata mesajları

**Muhtemel sebep:**
- BOT_TOKEN yanlış
- API_TOKEN yanlış
- Network sorunu

**Çözüm:**
Log'ları paylaşın, birlikte bakalım.

---

## 🎯 Hızlı Checklist

Sırayla kontrol edin:

1. [ ] Dokploy Settings → Environment Variables → `ADMIN_TELEGRAM_IDS=989928474` eklendi
2. [ ] Save tıklandı
3. [ ] Rebuild yapıldı
4. [ ] Deploy tamamlandı
5. [ ] Container restart edildi
6. [ ] Logs'ta "Bot is running" görüldü
7. [ ] Telegram `/start` çalışıyor ✅
8. [ ] Telegram `/admin` test edildi → ?

---

## 📊 Debug: Log Çıktısı Analizi

### Başarılı Deployment

```
[BUILD] npm run build
[BUILD] Build completed successfully
[DEPLOY] Starting container...
[LOG] ✅ Bot @your_bot is running!
[LOG] 📱 Commands: /start, /admin, /help, /app
[LOG] API server listening on port 3000
```

### `/admin` komutu çalıştığında

```
[LOG] 🔍 /admin komutu çalıştırıldı
[LOG]    Telegram ID: 989928474
[LOG]    Username: spinline
[LOG]    ADMIN_TELEGRAM_IDS env: 989928474
[LOG]    Parsed admin IDs: [989928474]
[LOG]    Is admin? true
[LOG]    ✅ Admin yetkisi var - panel açılıyor
[LOG]    ✅ Admin paneli mesajı gönderildi
```

### Hatalı Durum (Environment Variable eksik)

```
[LOG] 🔍 /admin komutu çalıştırıldı
[LOG]    Telegram ID: 989928474
[LOG]    ADMIN_TELEGRAM_IDS env: undefined ❌
[LOG]    Parsed admin IDs: []
[LOG]    Is admin? false
[LOG]    ❌ Yetki yok - mesaj gönderiliyor
```

Telegram'da mesaj: "⛔ Bu komutu kullanma yetkiniz yok."

---

## 💡 Pro Tip: Dokploy Auto Deploy

Eğer Dokploy GitHub ile bağlıysa:

1. **Settings** → **Git Integration**
2. **Auto Deploy** aktif mi kontrol edin
3. Aktifse, her `git push` sonrası otomatik deploy olur

**Manuel deploy için:**
- Deployments → Trigger Deploy

---

## 🆘 Hala Çalışmıyorsa

**Dokploy Logs'tan şunları kopyalayın:**

1. Build logs (son 50 satır)
2. Runtime logs (son 50 satır)
3. `/admin` komutunu çalıştırdıktan sonraki logs

Bana gönderin, birlikte çözelim!

---

**Özet:** Settings → Environment Variables → `ADMIN_TELEGRAM_IDS=989928474` → Save → Rebuild → Deploy → Restart → Test! 🚀

