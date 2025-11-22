# 👨‍💼 Admin Panel Kullanım Kılavuzu

## 📖 Genel Bakış

Admin Panel, RemnaWave VPN sisteminizi Telegram üzerinden yönetmenizi sağlar. Kullanıcı listesi, istatistikler, toplu bildirimler ve daha fazlası için tek komut: `/admin`

---

## 🔐 Admin Yetkisi Verme

### 1. Admin Telegram ID'sini Öğrenin

Telegram'da [@userinfobot](https://t.me/userinfobot) veya [@myidbot](https://t.me/myidbot)'a mesaj gönderin.

**Örnek Yanıt:**
```
Your Telegram ID: 989928474
```

### 2. `.env.production` Dosyasına Ekleyin

```bash
# Tek admin
ADMIN_TELEGRAM_IDS=989928474

# Birden fazla admin (virgülle ayrılmış)
ADMIN_TELEGRAM_IDS=989928474,123456789,987654321
```

### 3. Backend'i Restart Edin

```bash
# PM2
pm2 restart telegram-bot

# Docker
docker-compose restart backend
```

---

## 💻 Admin Panel Kullanımı

### Paneli Açma

Telegram'da botunuza `/admin` komutunu gönderin:

```
/admin
```

**Admin değilseniz:**
```
⛔ Bu komutu kullanma yetkiniz yok.
```

**Admin iseniz:**
```
👨‍💼 Admin Paneli

Yönetim fonksiyonlarını seçin:

[👥 Kullanıcı Listesi] [🔍 Kullanıcı Ara]
[📢 Toplu Bildirim] [📊 İstatistikler]
[⚙️ Kullanıcı İşlemleri] [📝 Sistem Logları]
[💾 Sistem Durumu]
```

---

## 📚 Özellikler

### 👥 Kullanıcı Listesi

İlk 10 kullanıcıyı listeler.

**Gösterilen Bilgiler:**
- Durum ikonu (🟢 Aktif, 🟡 Limitli, 🔴 Süresi Dolmuş)
- Kullanıcı adı
- Trafik kullanımı (Kullanılan / Toplam)

**Örnek Çıktı:**
```
👥 Kullanıcı Listesi (İlk 10)

1. 🟢 john_doe
   📊 1.52 GB / 2 GB

2. 🟡 jane_smith
   📊 2.01 GB / 2 GB

3. 🟢 test_user
   📊 0.45 GB / 50 GB
```

**Gelecek Özellikler:**
- Sayfalama (sonraki 10, önceki 10)
- Filtreleme (sadece aktif, sadece limitli)
- Sıralama (trafik, tarih, alfabetik)

---

### 🔍 Kullanıcı Arama

Kullanıcı adı ile arama yapın.

**Kullanım:**
1. "Kullanıcı Ara" butonuna tıklayın
2. Kullanıcı adını yazın
3. Kullanıcı detaylarını görün

**Örnek:**
```
🔍 Kullanıcı Arama

Kullanıcı adı yazın:
```

👉 Yazın: `john_doe`

```
👤 john_doe

Durum: 🟢 Aktif
Plan: TRIAL
Trafik: 1.52 GB / 2 GB (76%)
Süre: 2 gün 14 saat kalan
Telegram ID: 123456789
Kayıt: 19 Kas 2025
```

**Gelecek Özellikler:**
- Telegram ID ile arama
- Email ile arama
- Fuzzy search (yaklaşık eşleşme)

---

### 📢 Toplu Bildirim

Tüm kullanıcılara veya belirli gruplara toplu mesaj gönderin.

**Kullanım:**
1. "Toplu Bildirim" butonuna tıklayın
2. Mesajınızı yazın
3. Hedef grubu seçin (Tümü/Aktif/Limitli/vb.)
4. Onaylayın ve gönderin

**Örnek:**
```
📢 Toplu Bildirim

Göndermek istediğiniz mesajı yazın:
```

👉 Yazın: `Sistemde bakım yapılacaktır. 22 Kasım 02:00-04:00 arası kesinti olabilir.`

```
📢 Toplu Bildirim Önizleme

Mesaj:
"Sistemde bakım yapılacaktır. 22 Kasım 02:00-04:00 arası kesinti olabilir."

Hedef: [Tümü ▼]
Kullanıcı sayısı: 156 kişi

[✅ Gönder] [❌ İptal]
```

**Güvenlik:**
- Onay ekranı var
- Gönderim sayısı gösterilir
- Geri alma seçeneği yok (dikkatli olun!)

**Gelecek Özellikler:**
- Zamanlı gönderim
- Segment seçimi (aktif, limitli, vb.)
- Mesaj şablonları
- Gönderim geçmişi

---

### 📊 İstatistikler

Sistem geneli istatistikleri görüntüleyin.

**Gösterilen Metrikler:**
```
📊 Sistem İstatistikleri

👥 Toplam Kullanıcı: 156
🟢 Aktif: 142
🟡 Limitli: 8
🔴 Süresi Dolmuş: 6

📈 Toplam Trafik: 234.56 GB
📊 Ortalama Trafik: 1.50 GB/kullanıcı
```

**Gelecek Özellikler:**
- Grafik gösterimi
- Günlük/haftalık/aylık trend
- Yeni kayıt sayısı
- Churn rate (kullanıcı kaybı)
- Gelir raporları

---

### ⚙️ Kullanıcı İşlemleri

Kullanıcılar üzerinde işlem yapın.

**Mevcut İşlemler:**
```
⚙️ Kullanıcı İşlemleri

[✅ Kullanıcı Aktifleştir] [⛔ Kullanıcı Pasifleştir]
[⏰ Süre Uzat] [📊 Trafik Ekle]
```

#### ✅ Kullanıcı Aktifleştir
Pasif veya limitli hesabı aktif hale getirir.

**Kullanım:**
1. Kullanıcı adını girin
2. Onaylayın

**Örnek:**
```
✅ Hangi kullanıcıyı aktifleştirmek istiyorsunuz?

Kullanıcı adı: john_doe

[✅ Aktifleştir] [❌ İptal]
```

#### ⛔ Kullanıcı Pasifleştir
Aktif hesabı devre dışı bırakır.

**Kullanım:**
1. Kullanıcı adını girin
2. Sebep yazın (opsiyonel)
3. Onaylayın
4. Kullanıcıya bildirim gönderilir

#### ⏰ Süre Uzat
Kullanıcının abonelik süresini uzatır.

**Kullanım:**
1. Kullanıcı adını girin
2. Süre ekle (gün)
3. Onaylayın

**Örnek:**
```
⏰ Süre Uzatma

Kullanıcı: john_doe
Mevcut bitiş: 24 Kas 2025

Kaç gün eklemek istiyorsunuz?
👉 30

Yeni bitiş: 24 Ara 2025

[✅ Uygula] [❌ İptal]
```

#### 📊 Trafik Ekle
Kullanıcının trafik kotasını artırır.

**Kullanım:**
1. Kullanıcı adını girin
2. Trafik miktarı (GB)
3. Onaylayın

---

### 💾 Sistem Durumu

Backend sunucu durumunu görüntüleyin.

**Gösterilen Bilgiler:**
```
💾 Sistem Durumu

⏱️ Uptime: 5g 12s 34d
💾 Bellek: 145.23 MB / 512.00 MB
🤖 Bot: Çalışıyor ✅
🔗 Webhook: Aktif ✅
📡 RemnaWave API: Bağlı ✅
```

**Gelecek Özellikler:**
- CPU kullanımı
- Disk kullanımı
- Network istatistikleri
- Son hata logları
- Performans metrikleri

---

### 📝 Sistem Logları

Backend log'larını görüntüleyin.

**Gösterilecek Loglar:**
- Son 50 log satırı
- Hata logları
- Webhook olayları
- Bildirim gönderim logları

**Örnek Çıktı:**
```
📝 Sistem Logları (Son 50)

2024-11-21 18:55:10 | 📡 Webhook received: user.modified
2024-11-21 18:55:10 | ✅ Notification sent: john_doe
2024-11-21 18:54:32 | 🔍 User search: jane_smith
2024-11-21 18:52:15 | 📢 Broadcast sent to 156 users
2024-11-21 18:50:01 | ⚙️ User activated: test_user
```

**Gelecek Özellikler:**
- Filtreleme (sadece hatalar, sadece webhook)
- Arama (kullanıcı adı, event türü)
- Export (log dosyası indir)

---

## 🔒 Güvenlik

### Yetki Kontrolü

Her admin komutu çalıştırılmadan önce:

```typescript
const adminIds = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => parseInt(id));

if (!adminIds.includes(telegramId)) {
  return ctx.reply("⛔ Bu komutu kullanma yetkiniz yok.");
}
```

### Audit Log

Tüm admin işlemleri loglanır:

```
2024-11-21 18:55:10 | ADMIN | 989928474 | User activated: john_doe
2024-11-21 18:54:32 | ADMIN | 989928474 | Broadcast sent to 156 users
```

### İki Faktörlü Onay

Kritik işlemler için onay ekranı:

```
⚠️ DİKKAT

156 kullanıcıya toplu mesaj gönderilecek.
Bu işlem geri alınamaz!

[✅ Eminim, Gönder] [❌ İptal]
```

---

## 📊 Kullanım İstatistikleri

Admin paneli kullanım metrikleri:

```
👨‍💼 Admin İstatistikleri

Bu hafta:
- 23 kullanıcı arama
- 5 toplu bildirim
- 12 kullanıcı işlemi
- 45 istatistik görüntüleme

En aktif admin: @admin_user (34 işlem)
```

---

## 🚀 Gelecek Özellikler

### v1.1

- [ ] **Gelişmiş Filtreleme:** Kullanıcı listesinde filtreleme ve sıralama
- [ ] **Toplu İşlemler:** Birden fazla kullanıcı seç ve işlem yap
- [ ] **Mesaj Şablonları:** Hazır bildirim şablonları
- [ ] **Zamanlı Bildirim:** İleri tarihli toplu mesaj gönderimi

### v1.2

- [ ] **Grafik ve Raporlar:** Görsel istatistikler
- [ ] **Export:** Kullanıcı listesi ve raporları Excel/CSV
- [ ] **Otomatik Aksiyonlar:** Kural tabanlı otomatik işlemler
- [ ] **Webhook Log Viewer:** Tüm webhook event'lerini görüntüleme

### v2.0

- [ ] **Rol Bazlı Yetkilendirme:** Süper admin, admin, moderatör
- [ ] **Dashboard:** Web tabanlı admin paneli
- [ ] **Real-time Monitoring:** Canlı kullanıcı aktivitesi
- [ ] **AI Insights:** Kullanım trendleri ve öneriler

---

## 💡 İpuçları

### Hızlı Erişim

`/admin` komutunu Telegram'da "Komutlar" menüsüne ekleyin:

BotFather → `/setcommands` → Ekleyin:
```
admin - Admin panelini aç (sadece adminler)
```

### Kısayol Butonları

Sık kullanılan işlemler için bot mesajınıza buton ekleyin:

```
[⚡ Hızlı Admin] ← Bu butona tıklayınca /admin açılır
```

### Bildirim Ayarları

Telegram'da botun bildirimlerini özelleştirin:
- Sessiz bildirimler için: Grup ayarlarından sessiz moda al
- Önemli mesajlar için: Pin message kullanın

---

## 🆘 Sorun Giderme

### "Bu komutu kullanma yetkiniz yok" Hatası

**Sebep:** Telegram ID'niz admin listesinde değil.

**Çözüm:**
1. Telegram ID'nizi kontrol edin: @userinfobot
2. `.env.production` dosyasında `ADMIN_TELEGRAM_IDS` kontrol edin
3. Backend'i restart edin

### Kullanıcı Listesi Boş Geliyor

**Sebep:** RemnaWave API bağlantı sorunu.

**Çözüm:**
1. RemnaWave API erişilebilir mi? `curl https://remnawave.../api/users`
2. API token geçerli mi? `.env.production` kontrol edin
3. Backend log'larını kontrol edin: `pm2 logs telegram-bot`

### İşlem Başarısız Oluyor

**Sebep:** API hatası veya yetersiz yetki.

**Çözüm:**
1. RemnaWave API log'larını kontrol edin
2. Backend log'larında hata detaylarına bakın
3. API token'ın yetkilerini kontrol edin

---

## 📚 API Entegrasyonu

Admin panel RemnaWave API'yi kullanır. Gerekli endpoint'ler:

```
GET  /api/users              # Kullanıcı listesi
GET  /api/users/:id          # Kullanıcı detayı
POST /api/users              # Kullanıcı oluştur
PUT  /api/users/:id          # Kullanıcı güncelle
DELETE /api/users/:id        # Kullanıcı sil
GET  /api/stats              # İstatistikler
```

**Gerekli İzinler:**
- API token'ın `users:read`, `users:write` yetkisi olmalı

---

Daha fazla bilgi için: [README.md](../README.md)

