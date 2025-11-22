# 🚨 ACİL: BACKEND ÇALIŞMIYOR - SADECE FRONTEND LOGLARI VAR

## Durum

**Dokploy Logs'ta sadece Caddy (frontend) log'ları görünüyor:**
```
{"level":"info","ts":1763807950.0770864,"msg":"adapted config to JSON","adapter":"caddyfile"}
{"level":"warn","ts":1763807950.077323,"logger":"admin","msg":"admin endpoint disabled"}
```

**Backend log'ları YOK:**
```
OpenAPI document loaded.
API server listening on port 3000
Bot @auronvpn_bot is running!
```

## ✅ SORUN: Backend Container Çalışmıyor!

### Muhtemel Sebepler:

1. **Backend ve Frontend ayrı projeler** - Yanlış projeye bakıyorsunuz
2. **Backend crash oldu** - Başlamadı bile
3. **Backend farklı bir service** - Logs'u başka yerde

---

## 🔴 DOKPLOY'DA ŞİMDİ YAPIN

### 1. Projeleri Kontrol Edin

**Dokploy Dashboard'da:**

Kaç tane proje var?
- `telegram-ts-bot-backend` ← Backend
- `telegram-ts-bot-frontend` ← Frontend

**İki ayrı proje olabilir!**

### 2. Backend Projesine Gidin

**Dokploy'da:**
1. Sol menüden projeleri listeleyin
2. **`telegram-ts-bot-backend`** veya **`backend`** isimli projeyi bulun
3. O projeyi açın
4. **Logs** sekmesine bakın

**Görmeli:**
```
npm run start
OpenAPI document loaded.
API server listening on port 3000
🤖 Starting Telegram bot (long polling)...
✅ Bot @auronvpn_bot is running!
```

### 3. Container Durumunu Kontrol Edin

**Backend projesinde:**
- **Overview** sekmesi
- **Status:** Running mi? Stopped mu? Crashed mi?

**Eğer Stopped/Crashed:**
- **Start** butonuna tıklayın
- Logs'u izleyin

---

## 🔍 ALTERNATIF: Docker Compose Kullanıyorsanız

Eğer tek bir proje içinde hem backend hem frontend varsa:

**Dokploy'da:**
1. **Services** veya **Containers** sekmesi
2. Kaç container var? (backend + frontend = 2 olmalı)
3. Her birinin log'larını ayrı ayrı kontrol edin

---

## 📋 HIZLI KONTROL LİSTESİ

Dokploy'da şunları kontrol edin ve işaretleyin:

### Backend Container:
- [ ] Backend projesi/container var mı?
- [ ] Backend container çalışıyor mu? (Running)
- [ ] Backend logs'ta "Bot is running" var mı?
- [ ] Backend port 3000'de mi çalışıyor?

### Frontend Container:
- [ ] Frontend projesi/container var mı?
- [ ] Frontend çalışıyor mu? (Caddy logs görünüyor = çalışıyor)

---

## 🎯 BACKEND LOGS NASIL BULUNUR

### Yöntem 1: Ayrı Projeler

**Dokploy Dashboard:**
```
Projects →
  ├─ telegram-ts-bot-backend  ← BURAYA GİRİN!
  │   └─ Logs (Backend logs burada)
  │
  └─ telegram-ts-bot-frontend
      └─ Logs (Caddy logs - şu an baktığınız yer)
```

### Yöntem 2: Tek Proje, Çoklu Servis

**Dokploy Project:**
```
Services →
  ├─ backend  ← Bu servisin log'larına bakın
  └─ frontend ← Caddy logs (şu an baktığınız)
```

### Yöntem 3: Docker Compose

**Dokploy'da docker-compose.yml varsa:**
```yaml
services:
  backend:
    # Backend container
  frontend:
    # Frontend container
```

Her servisin ayrı log'u vardır.

---

## 🚨 BACKEND CRASH OLMUŞ OLABİLİR

Eğer backend container'ı bulduysanız ama çalışmıyorsa:

**Crash sebepleri:**

1. **BOT_TOKEN yanlış** → Bot başlamıyor
2. **API_TOKEN yanlış** → Hata veriyor
3. **Build hatası** → dist/ klasörü yok
4. **Port çakışması** → 3000 portu kullanımda
5. **Syntax error** → TypeScript hatası

**Çözüm:**
- Backend logs'ta hata mesajını bulun
- Bana gönderin
- Birlikte düzeltiriz

---

## 💡 HIZLI TEST: BACKEND ÇALIŞIYOR MU?

**Tarayıcıdan test edin:**

```
https://telegram-mini-app-backend.karatatar.com/health
```

**Beklenen yanıt:**
```json
{"status":"ok","uptime":12345}
```

**Eğer yanıt geliyorsa:**
→ Backend çalışıyor ama log'ları farklı yerde

**Eğer hata veriyorsa:**
→ Backend çalışmıyor

---

## 🔴 ŞİMDİ YAPMANIZ GEREKENLER

### Adım 1: Projeleri Listeleyin

**Dokploy Dashboard'da:**
- Sol menüden tüm projeleri görün
- Kaç proje var?
- İsimleri ne?

### Adım 2: Backend Projesini Bulun

**Proje ismi şunlardan biri olabilir:**
- `telegram-ts-bot-backend`
- `telegram-bot`
- `backend`
- `auronvpn-backend`

### Adım 3: Backend Logs'a Bakın

**Backend projesinde:**
- **Logs** sekmesi
- Ne görünüyor?

### Adım 4: Health Endpoint Test

**Tarayıcıda açın:**
```
https://telegram-mini-app-backend.karatatar.com/health
```

Yanıt var mı?

---

## 📝 BANA GÖNDERİN

1. **Dokploy'da kaç proje var?** İsimlerini yazın
2. **Backend projesinin log'ları nedir?** (Varsa)
3. **Health endpoint yanıtı:** Çalışıyor mu?
4. **Backend container status:** Running/Stopped/Crashed?

---

## 🎯 ÖZET

**Sorun:** Sadece frontend (Caddy) log'ları görünüyor, backend log'u yok

**Sebep:** Backend çalışmıyor veya yanlış yere bakıyorsunuz

**Çözüm:**
1. Dokploy'da backend projesini bulun
2. Backend logs'a bakın
3. Backend container'ı start edin (gerekirse)
4. Hata varsa düzeltin

---

**ŞİMDİ YAPIN:**

1. Dokploy → Projects → Backend projesini bulun
2. Backend Logs'a bakın
3. Health endpoint test edin: `https://telegram-mini-app-backend.karatatar.com/health`
4. Sonuçları bana bildirin!

🚀

