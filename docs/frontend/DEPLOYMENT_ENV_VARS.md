# Frontend Deployment Guide

Bu frontend uygulaması şu anda **Railpack** ile build ediliyor ve `serve` ile statik olarak sunuluyor.

## Ortam Özeti

- Builder: **Railpack (railpack-frontend)**
- Node.js: **22.13.0** (`.nvmrc` ile uyumlu)
- Install: `npm ci`
- Build: `npm run build`
- Start: `npm start` → `serve -s dist -l ${PORT:-3000}`

## Dokploy Ayarları

### 1. Build

- Build Type / Builder: **Railpack**
- Repository: `spinline/telegram-ts-bot`
- Branch: `main` (veya kullandığınız branch)
- Context Path: `frontend`
- Railpack config: **Gerekli değil** (Railpack Node projesini otomatik algılıyor)

### 2. Runtime / Port

`package.json` içindeki start script'i:

```json
"start": "serve -s dist -l ${PORT:-3000}"
```

Dokploy tarafında:

- Internal Port: **3000**
- External Port / Domain: Dokploy panelinden istediğiniz domain veya port ile eşleyin.

### 3. Environment Variables

Önerilen environment variable'lar:

```env
NODE_ENV=production
PORT=3000
```

Ek olarak, Vite tarafında kullanılan `VITE_...` değişkenleriniz varsa (örn. API URL):

```env
VITE_API_BASE_URL=https://api.example.com
# vb.
```

## Artık Kullanılmayanlar

- `frontend/nixpacks.toml` (silindi)
- `NIXPACKS_NODE_VERSION` gibi Nixpacks'e özel env değişkenlerine gerek yok.

Railpack build log'unda aşağıya benzer satırlar görmeniz yeterlidir:

```txt
↳ Detected Node
node  │  22.13.0  │  .nvmrc (22.13.0)
...
$ npm ci
$ npm run build
$ npm run start
```

Ve uygulama loglarında:

```txt
> frontend@0.0.0 start
> serve -s dist -l ${PORT:-3000}
INFO  Accepting connections at http://localhost:3000
HTTP ... GET /
HTTP ... Returned 200 in XX ms
```

Bu durumda frontend başarıyla deploy edilmiş ve çalışıyor demektir.
