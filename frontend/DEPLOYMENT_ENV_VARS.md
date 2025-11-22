# Frontend Deployment Environment Variables

## ⚠️ Önemli: Node.js Versiyon Sorunu

Vite **Node.js 22.12+** gerektiriyor ancak Nixpacks varsayılan olarak `nodejs_22` paketini kullanıyor ve bu **22.11.0** versionunu sağlıyor.

### 🎯 Çözüm: Dokploy'da Environment Variable Ekle

Dokploy Dashboard'da frontend servisiniz için şu environment variable'ı ekleyin:

```
Key: NIXPACKS_NODE_VERSION
Value: 22.13.0
```

### 📝 Adım Adım:

1. **Dokploy Dashboard'a gidin**
2. **Frontend servisinizi seçin**
3. **Environment Variables** bölümüne gidin
4. **Yeni variable ekleyin:**
   - Key: `NIXPACKS_NODE_VERSION`
   - Value: `22.13.0`
5. **Save/Apply** edin
6. **Redeploy** edin

### ✅ Sonuç:

Build log'unda şunu göreceksiniz:
```
✅ node --version
✅ v22.13.0  (22.11.0 değil!)
✅ No Vite warning!
```

### 🔧 Diğer Environment Variables:

```
PORT=3000
NIXPACKS_NODE_VERSION=22.13.0
```

### 📚 Referanslar:

- Nixpacks Node.js Provider: https://nixpacks.com/docs/providers/node
- Vite Node.js Requirements: https://vitejs.dev/guide/#scaffolding-your-first-vite-project

