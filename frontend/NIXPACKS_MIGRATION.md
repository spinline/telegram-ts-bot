# Frontend: Nixpacks → Railpack Geçişi

Bu proje artık **Railpack** ile build ediliyor. `nixpacks.toml` sadece geçmişte kullanılan Nixpacks config’iydi ve kaldırıldı.

## Artık Kullanılmayanlar
- `frontend/nixpacks.toml`
- Kök dizindeki `nixpacks.toml` sadece backend için; frontend Railpack kullanıyor.

## Şu Anki Build
- Builder: Railpack (railpack-frontend)
- Node: 22.13.0 (`.nvmrc` ile uyumlu)
- Install: `npm ci`
- Build: `npm run build`
- Start: `npm start` → `serve -s dist -l ${PORT:-3000}`

Bu dosya sadece dokümantasyon amaçlıdır; Nixpacks tekrar kullanılmayacaktır.

