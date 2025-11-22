# 🏗️ Backend Architecture

## Mimari Yapısı

Proje clean architecture prensiplerine göre katmanlara ayrılmıştır:

```
src/
├── config/           # Configuration management
├── middlewares/      # Express & Grammy middlewares
├── services/         # Business logic layer
├── handlers/         # Command & callback handlers
├── controllers/      # HTTP controllers
├── utils/            # Helper utilities
└── types/            # TypeScript types
```

## Katmanlar

### 1. Config Layer (`config/`)

Environment variables yönetimi ve validation.

```typescript
import { env } from './config/env';

console.log(env.BOT_TOKEN);
console.log(env.ADMIN_TELEGRAM_IDS);
```

### 2. Middleware Layer (`middlewares/`)

#### Auth Middleware
```typescript
import { adminAuthMiddleware } from './middlewares/auth.middleware';

bot.command("admin", adminAuthMiddleware, async (ctx) => {
  // Only admins reach here
});
```

#### Error Middleware
```typescript
import { errorHandler } from './middlewares/error.middleware';

bot.catch(errorHandler);
```

#### Session Middleware
```typescript
import { sessionManager } from './middlewares/session.middleware';

sessionManager.set(userId, { action: 'search' });
const session = sessionManager.get(userId);
```

### 3. Service Layer (`services/`)

#### Telegram Service
```typescript
import { telegramService } from './services/telegram.service';

await telegramService.sendMessage(chatId, "Hello!");
await telegramService.broadcast([id1, id2], "Broadcast message");
```

#### User Service
```typescript
import { userService } from './services/user.service';

const users = await userService.getUsers();
const stats = await userService.getStatistics();
const details = userService.formatUserDetails(user);
```

#### Notification Service
```typescript
import { notificationService } from './services/notification.service';

await notificationService.broadcast("Maintenance tonight!");
await notificationService.sendAccountLimited(userId, 'traffic');
```

### 4. Utils Layer (`utils/`)

#### Logger
```typescript
import { logger } from './utils/logger';

logger.info("Server started");
logger.warn("Low memory");
logger.error("Database connection failed");
logger.debug("Debug info");
```

#### Validators
```typescript
import { validateUsername, validateMessage } from './utils/validators';

const username = validateUsername(input); // throws ValidationError
const message = validateMessage(text);
```

## Design Patterns

### 1. **Singleton Pattern**
Services (TelegramService, UserService) singleton olarak kullanılır.

### 2. **Dependency Injection**
Servisler birbirini import eder, tight coupling'i önler.

### 3. **Middleware Pattern**
Grammy ve Express middlewares ile separation of concerns.

### 4. **Service Layer Pattern**
Business logic controller'lardan ayrılmış.

## Best Practices

### ✅ DO
- Middlewares kullan (auth, error handling)
- Services katmanında business logic
- Utils'te reusable helpers
- Config'te tüm env variables
- Logger kullan (console.log yerine)
- Validation yap (user input)

### ❌ DON'T
- index.ts'te business logic yazma
- Hardcoded values
- Direct console.log
- God objects (1000+ satır)
- Tight coupling

## Migration Guide

Eski kod:
```typescript
// index.ts (1068 satır)
const BOT_TOKEN = process.env.BOT_TOKEN;
bot.command("admin", async (ctx) => {
  const isAdmin = checkAdmin(ctx.from.id);
  // ... 100 satır kod
});
```

Yeni kod:
```typescript
// config/env.ts
export const env = parseEnv();

// middlewares/auth.middleware.ts
export async function adminAuthMiddleware(ctx, next) { ... }

// handlers/commands/admin.handler.ts
export async function adminHandler(ctx) {
  // ... temiz, odaklanmış kod
}

// index.ts (100 satır)
bot.command("admin", adminAuthMiddleware, adminHandler);
```

## Benefits

1. **Maintainability** - Kod 10x daha kolay anlaşılır
2. **Testability** - Her katman ayrı test edilebilir
3. **Scalability** - Yeni özellik eklemek kolay
4. **Reusability** - Services ve utils tekrar kullanılabilir
5. **Team Work** - Ekip çalışmasına uygun

## Next Steps

1. ✅ Config layer - DONE
2. ✅ Middleware layer - DONE
3. ✅ Service layer - DONE
4. ✅ Utils layer - DONE
5. ⏳ Migrate handlers
6. ⏳ Migrate controllers
7. ⏳ Add tests
8. ⏳ Add documentation

