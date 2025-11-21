# 🔐 Güvenlik Uyarısı - .env.production Dosyası

## ⚠️ ÖNEMLİ GÜVENLİK NOTU

`.env.production` dosyası **asla** git'e commit edilmemelidir! Bu dosya hassas bilgiler içerir:
- API token'ları
- Bot token'ları
- Webhook secret'ları
- Database şifreleri

## ✅ Yapılması Gerekenler

### 1. .env.production Dosyasını Oluşturun

```bash
cd backend
cp .env.production.example .env.production
```

### 2. Gerçek Değerleri Girin

`.env.production` dosyasını açın ve placeholder'ları gerçek değerlerle değiştirin:

```bash
# Webhook secret oluşturun
openssl rand -hex 64

# Test token oluşturun  
openssl rand -hex 32
```

### 3. Dosyanın Git'e Eklenmediğinden Emin Olun

`.gitignore` dosyasında zaten var:
```
backend/.env.production
```

### 4. Eğer Yanlışlıkla Commit Ettiyseniz

**Webhook ve token'ları hemen değiştirin!** Eski değerler artık güvensiz.

1. Yeni secret'lar oluşturun:
```bash
# Yeni webhook secret
openssl rand -hex 64

# Yeni internal token
openssl rand -hex 32
```

2. `.env.production` dosyasını güncelleyin

3. RemnaWave panelinde webhook secret'ı güncelleyin

4. Backend servisini restart edin

## 🔒 Güvenlik En İyi Uygulamalar

### ✅ Yapın:
- `.env*` dosyalarını `.gitignore`'a ekleyin
- `.env.example` veya `.env.template` dosyası oluşturun (placeholder'larla)
- Secret'ları güçlü ve rastgele oluşturun
- Her ortam için farklı secret'lar kullanın (dev, staging, prod)
- Secret'ları düzenli olarak rotate edin

### ❌ Yapmayın:
- `.env` veya `.env.production` dosyalarını commit etmeyin
- Secret'ları kod içine hard-code etmeyin
- Secret'ları Slack/Discord/Email ile paylaşmayın
- Basit veya tahmin edilebilir secret'lar kullanmayın
- Public repository'lerde secret saklayın

## 🚨 Git Geçmişinden Silme

Eğer `.env.production` daha önce commit edildiyse, git history'den tamamen silmek için:

```bash
# BFG Repo-Cleaner kullanarak (önerilen)
git filter-repo --path backend/.env.production --invert-paths

# Veya git filter-branch (eski yöntem)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env.production" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DİKKAT: Ekip ile koordine edin!)
git push origin --force --all
```

**⚠️ UYARI:** Force push, diğer geliştiricileri etkileyebilir. Ekiple koordine olun!

## 📋 Checklist

Güvenlik kontrolü:

- [ ] `.env.production` `.gitignore`'da mı?
- [ ] `.env.production.example` oluşturuldu mu?
- [ ] Gerçek secret'lar `.env.production`'da mı?
- [ ] `.env.production` git'te yok mu? (`git ls-files | grep .env.production`)
- [ ] Eğer commit edildiyse, yeni secret'lar oluşturuldu mu?
- [ ] RemnaWave webhook secret'ı güncellendi mi?
- [ ] Backend servisi restart edildi mi?

## 🆘 Acil Durum

Eğer secret'lar GitHub'a yüklendiyse:

1. ✅ **HEMEN** yeni secret'lar oluşturun
2. ✅ Tüm servisleri güncelleyin
3. ✅ `.env.production`'ı git'ten kaldırın
4. ✅ Git history'den silin (yukarıdaki komutlar)
5. ✅ GitHub security log'larını kontrol edin
6. ✅ API access log'larını inceleyin

## 📚 Daha Fazla Bilgi

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [12 Factor App - Config](https://12factor.net/config)
- [OWASP - Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)

