# 🎨 Frontend Architecture

## Modern React Architecture with TypeScript

Bu proje **Clean Architecture** prensiplerine göre yapılandırılmıştır.

## 📁 Klasör Yapısı

```
src/
├── components/              # UI Components
│   ├── screens/            # Page/Screen components
│   ├── common/             # Reusable UI components
│   │   ├── ShieldAnimation.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── index.ts       # Barrel export
│   └── layouts/            # Layout components
│
├── hooks/                  # Custom React Hooks
│   ├── useAccount.ts      # Account data management
│   ├── useTelegram.ts     # Telegram WebApp integration
│   ├── useNavigation.ts   # Navigation logic
│   └── index.ts           # Barrel export
│
├── services/               # External services
│   ├── api.ts             # Backend API calls
│   └── telegram.ts        # Telegram WebApp service
│
├── types/                  # TypeScript type definitions
│   ├── account.ts         # Account related types
│   ├── navigation.ts      # Navigation types
│   └── telegram.ts        # Telegram WebApp types
│
├── utils/                  # Utility functions
│   ├── formatters.ts      # Data formatting helpers
│   ├── constants.ts       # App constants
│   └── index.ts           # Barrel export
│
├── styles/                 # Global styles
│
├── App.tsx                 # Main application component
└── main.tsx               # Application entry point
```

## 🎯 Architecture Principles

### 1. **Separation of Concerns**
- UI logic in components
- Business logic in hooks
- API calls in services
- Type definitions in types folder

### 2. **Custom Hooks**
Reusable hooks for:
- `useAccount()` - Account data fetching and state
- `useTelegram()` - Telegram WebApp functionality
- `useNavigation()` - Screen navigation and history

### 3. **Service Layer**
- `apiService` - Backend API communication
- `telegramService` - Telegram WebApp wrapper (Singleton)

### 4. **Type Safety**
- Full TypeScript coverage
- Strict type checking
- Shared type definitions

## 🚀 Usage Examples

### Using Barrel Exports (Recommended)
```typescript
// Clean imports using barrel exports
import { useTelegram, useAccount, useNavigation } from './hooks';
import { ShieldAnimation, StatusBadge, LoadingScreen } from './components/common';
import { formatBytes, formatDate, COLORS } from './utils';
```

### Using Telegram Hook
```typescript
import { useTelegram } from './hooks/useTelegram';

function MyComponent() {
  const { user, haptic, close } = useTelegram();
  
  const handleClick = () => {
    haptic('light');
    // do something
  };
}
```

### Using Account Hook
```typescript
import { useAccount } from './hooks/useAccount';

function MyComponent() {
  const { account, loading, error, isRegistered } = useAccount();
  
  if (loading) return <Loader />;
  if (error) return <Error message={error} />;
  
  return <AccountDetails account={account} />;
}
```

### Using Navigation Hook
```typescript
import { useNavigation } from './hooks/useNavigation';

function MyComponent() {
  const { currentScreen, navigateTo } = useNavigation();
  
  return (
    <button onClick={() => navigateTo('account')}>
      Go to Account
    </button>
  );
}
```

### Using Common Components
```typescript
import { ShieldAnimation, StatusBadge, LoadingScreen } from './components/common';

function MyScreen() {
  return (
    <>
      <ShieldAnimation size={120} color="teal" />
      <StatusBadge status="online" size="lg" />
      <LoadingScreen message="Hesap bilgileri yükleniyor..." />
    </>
  );
}
```

## 📊 Benefits

### Before (Monolithic)
- ❌ All components in root (1817 lines)
- ❌ Mixed concerns
- ❌ Hard to test
- ❌ Difficult to maintain

### After (Clean Architecture)
- ✅ Modular structure
- ✅ Clear separation of concerns
- ✅ Easy to test
- ✅ Scalable and maintainable
- ✅ Reusable hooks and utilities

## 🧪 Testing

Each layer can be tested independently:

```typescript
// Test hooks
import { renderHook } from '@testing-library/react-hooks';
import { useAccount } from './hooks/useAccount';

test('useAccount fetches data', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useAccount());
  await waitForNextUpdate();
  expect(result.current.account).toBeDefined();
});

// Test services
import { telegramService } from './services/telegram';

test('telegram service triggers haptic', () => {
  const spy = jest.spyOn(telegramService, 'hapticFeedback');
  telegramService.hapticFeedback('light');
  expect(spy).toHaveBeenCalledWith('light');
});
```

## 🔧 Development

### Adding a New Screen
1. Create component in `components/screens/`
2. Add screen type to `types/navigation.ts`
3. Use `useNavigation` hook to navigate

### Adding a New Hook
1. Create hook in `hooks/`
2. Follow naming convention: `useSomething.ts`
3. Export hook function

### Adding API Endpoint
1. Add function to `services/api.ts`
2. Add types to `types/` if needed
3. Use in hooks or components

## 📚 Further Reading

- [React Hooks Documentation](https://react.dev/reference/react)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

