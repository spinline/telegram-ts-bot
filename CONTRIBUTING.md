# Katkıda Bulunma Rehberi

Telegram VPN Bot projesine katkıda bulunmayı düşündüğünüz için teşekkür ederiz! 🎉

## 📋 İçindekiler

- [Davranış Kuralları](#davranış-kuralları)
- [Nasıl Katkıda Bulunabilirim?](#nasıl-katkıda-bulunabilirim)
- [Geliştirme Süreci](#geliştirme-süreci)
- [Commit Standartları](#commit-standartları)
- [Pull Request Süreci](#pull-request-süreci)
- [Kod Standartları](#kod-standartları)

---

## 📜 Davranış Kuralları

Bu proje katılımcıları aşağıdaki kurallara uymayı kabul eder:

- ✅ Saygılı ve yapıcı olun
- ✅ Farklı görüşlere açık olun
- ✅ Eleştirileri nazikçe yapın ve kabul edin
- ❌ Aşağılayıcı, taciz edici veya nefret dolu davranışlar
- ❌ Kişisel bilgileri izinsiz paylaşmak

---

## 🤝 Nasıl Katkıda Bulunabilirim?

### Bug Bildirme

Bug bulduysanız:

1. [Issues](https://github.com/yourusername/telegram-ts-bot/issues) sayfasını kontrol edin (daha önce bildirilmiş mi?)
2. Yeni issue açın ve şunları ekleyin:
   - Açıklayıcı başlık
   - Adım adım tekrar etme yöntemi
   - Beklenen davranış vs gerçek davranış
   - Ekran görüntüleri/log'lar
   - Ortam bilgileri (Node.js versiyonu, OS, vb.)

**Örnek Bug Raporu:**

```markdown
## Bug: Webhook bildirimi gelmiyor

**Adımlar:**
1. RemnaWave'de kullanıcı kısıtlandı
2. Webhook log'larında event görünüyor
3. Ama Telegram'da bildirim gelmiyor

**Beklenen:** Telegram bildirimi gelmeli
**Gerçekleşen:** Bildirim gelmiyor

**Log:**
```
📡 Webhook received: user.modified
⚠️ Webhook: User john_doe has no Telegram ID
```

**Ortam:**
- Node.js: 18.17.0
- OS: Ubuntu 22.04
- RemnaWave: v1.2.3
```

### Özellik İsteği

Yeni özellik önerisi için:

1. [Discussions](https://github.com/yourusername/telegram-ts-bot/discussions) bölümünde tartışın
2. Topluluk geri bildirimi alın
3. Onaylandıktan sonra issue açın

**Örnek Özellik İsteği:**

```markdown
## Özellik: Çoklu dil desteği

**Problem:** Uluslararası kullanıcılar için Türkçe mesajlar anlaşılmıyor

**Çözüm:** i18n entegrasyonu ile çoklu dil desteği

**Detaylar:**
- İngilizce, Türkçe, Rusça dil seçenekleri
- Kullanıcı tercih ayarı
- Telegram dil ayarından otomatik tespit

**Alternatifler:** Manuel dil seçimi butonu
```

### Kod Katkısı

1. Repository'yi fork edin
2. Yeni branch oluşturun
3. Değişikliklerinizi yapın
4. Test edin
5. Pull Request açın

---

## 🛠️ Geliştirme Süreci

### Başlangıç

```bash
# 1. Fork edin ve klonlayın
git clone https://github.com/your-username/telegram-ts-bot.git
cd telegram-ts-bot

# 2. Upstream ekleyin
git remote add upstream https://github.com/original/telegram-ts-bot.git

# 3. Dependencies yükleyin
cd backend
npm install
cd ../frontend
npm install

# 4. Environment ayarlayın
cp backend/.env.production.example backend/.env.production
# .env.production'ı düzenleyin

# 5. Development mode başlatın
npm run dev
```

### Branch Stratejisi

- `main` - Production-ready kod
- `develop` - Development branch
- `feature/*` - Yeni özellikler
- `fix/*` - Bug düzeltmeleri
- `docs/*` - Dokümantasyon
- `refactor/*` - Kod iyileştirme

**Örnek:**

```bash
# Yeni özellik
git checkout -b feature/multi-language-support

# Bug fix
git checkout -b fix/webhook-notification-not-sent

# Dokümantasyon
git checkout -b docs/update-api-reference
```

---

## 📝 Commit Standartları

[Conventional Commits](https://www.conventionalcommits.org/) standardını kullanıyoruz.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type'lar

- `feat` - Yeni özellik
- `fix` - Bug düzeltmesi
- `docs` - Dokümantasyon
- `style` - Formatlama (kod mantığı değişmez)
- `refactor` - Kod iyileştirme
- `perf` - Performans iyileştirme
- `test` - Test ekleme/düzeltme
- `chore` - Genel bakım (build, deps, vb.)

### Örnekler

**Yeni Özellik:**
```bash
git commit -m "feat(webhook): add multi-language notification support

- i18n entegrasyonu eklendi
- TR, EN, RU dil desteği
- Kullanıcı tercih sistemi

Closes #123"
```

**Bug Fix:**
```bash
git commit -m "fix(notification): telegram ID kontrolü düzeltildi

Webhook handler'da telegramId null kontrolü eksikti.
Artık null/undefined durumları handle ediliyor.

Fixes #456"
```

**Dokümantasyon:**
```bash
git commit -m "docs(readme): webhook kurulum adımları güncellendi

RemnaWave webhook ayarları daha detaylı açıklandı."
```

---

## 🔀 Pull Request Süreci

### PR Oluşturmadan Önce

- [ ] Kod çalışıyor ve test edildi
- [ ] Yeni özellik için test eklendi
- [ ] Dokümantasyon güncellendi
- [ ] Commit'ler anlamlı ve standartlara uygun
- [ ] Branch güncel (`git pull upstream main`)

### PR Template

```markdown
## Değişiklik Türü

- [ ] Bug fix
- [ ] Yeni özellik
- [ ] Breaking change
- [ ] Dokümantasyon

## Açıklama

<!-- Ne değişti ve neden? -->

## İlgili Issue

Closes #123

## Nasıl Test Edildi?

<!-- Test adımlarını açıklayın -->

1. Backend başlattım
2. RemnaWave'den webhook gönderdim
3. Telegram'da bildirim geldiğini doğruladım

## Checklist

- [ ] Kod standartlarına uyuyor
- [ ] Testler eklendi/güncellendi
- [ ] Dokümantasyon güncellendi
- [ ] Commit mesajları standartlara uygun
- [ ] Breaking change yok (veya belirtildi)

## Ekran Görüntüleri (varsa)

<!-- Görsel değişiklikler için -->
```

### Review Süreci

1. PR açıldıktan sonra otomatik checks çalışır
2. En az 1 maintainer review yapmalı
3. Değişiklik istenir veya approve edilir
4. Approve sonrası merge edilir

### Merge Stratejisi

- Feature PR'lar → `develop` branch'e
- Release → `develop` → `main` merge
- Hotfix → Direkt `main` (acil)

---

## 💻 Kod Standartları

### TypeScript

```typescript
// ✅ DOĞRU
interface WebhookEvent {
  event: string;
  timestamp: string;
  data: {
    user?: UserData;
  };
}

async function handleWebhook(bot: Bot, event: WebhookEvent): Promise<void> {
  // ...
}

// ❌ YANLIŞ
function handleWebhook(bot, event) {
  // Tip tanımlamaları yok
}
```

### Linting

```bash
# Lint kontrolü
npm run lint

# Auto-fix
npm run lint:fix
```

### Naming Convention

- **Değişkenler:** camelCase (`telegramId`, `webhookSecret`)
- **Fonksiyonlar:** camelCase (`handleWebhook`, `sendNotification`)
- **Interface/Type:** PascalCase (`WebhookEvent`, `UserData`)
- **Sabitler:** UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)

### Dosya Yapısı

```
backend/src/
├── index.ts          # Ana uygulama entry point
├── webhook.ts        # Webhook handler
├── api.ts            # RemnaWave API client
├── types.d.ts        # Tip tanımlamaları
└── utils/            # Yardımcı fonksiyonlar
    ├── logger.ts
    └── crypto.ts
```

### Error Handling

```typescript
// ✅ DOĞRU
try {
  await bot.api.sendMessage(telegramId, text);
  console.log(`✅ Notification sent: ${username}`);
} catch (e: any) {
  console.error('❌ Failed to send notification:', e?.message || e);
  return { ok: false, error: e?.message };
}

// ❌ YANLIŞ
try {
  await bot.api.sendMessage(telegramId, text);
} catch (e) {
  // Hata loglanmıyor!
}
```

### Logging

```typescript
// ✅ DOĞRU - Production ready
console.log('📡 Webhook received:', event.event);
console.log(`✅ Notification sent: ${username} (${telegramId})`);
console.error('❌ Webhook error:', e?.message);

// ❌ YANLIŞ - Debug log'ları
console.log('Headers:', JSON.stringify(req.headers));
console.log('Full body:', JSON.stringify(req.body, null, 2));
```

---

## 🧪 Test

### Unit Test

```bash
npm test
```

### Integration Test

```bash
npm run test:integration
```

### Test Yazma

```typescript
// tests/webhook.test.ts
describe('Webhook Handler', () => {
  it('should send notification when traffic exceeded', async () => {
    const event = {
      event: 'user.modified',
      data: {
        usedTrafficBytes: '2170651648',
        trafficLimitBytes: '2147483648',
        telegramId: 123456789
      }
    };

    const result = await handleWebhook(mockBot, event);
    
    expect(result.ok).toBe(true);
    expect(mockBot.api.sendMessage).toHaveBeenCalled();
  });
});
```

---

## 📚 Ek Kaynaklar

- [RemnaWave Documentation](https://docs.rw)
- [Grammy Documentation](https://grammy.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 🆘 Yardım

Sorunuz mu var?

- **GitHub Discussions:** Genel sorular
- **GitHub Issues:** Bug raporları
- **Email:** your@email.com

---

Katkılarınız için teşekkürler! 🙏

