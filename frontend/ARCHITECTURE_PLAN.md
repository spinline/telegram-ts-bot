# 🎨 Frontend Architecture Plan

## Current State (❌ Needs Improvement)

```
frontend/src/
├── AccountPage.tsx          # 300+ lines
├── AddSubscription.tsx
├── App.tsx                  # 300+ lines - too big!
├── BuySubscription.tsx
├── Congratulations.tsx
├── InstallOnThisDevice.tsx
├── InstallSetup.tsx
├── WelcomeScreen.tsx
├── App.css
├── index.css
├── main.tsx
└── telegram.ts

Total: 1817 lines - Monolithic structure
```

## Proposed Modern Architecture

```
frontend/src/
├── components/              # Reusable UI components
│   ├── screens/            # Page components
│   │   ├── WelcomeScreen.tsx
│   │   ├── AccountPage.tsx
│   │   ├── BuySubscription.tsx
│   │   ├── InstallSetup.tsx
│   │   ├── InstallOnThisDevice.tsx
│   │   ├── AddSubscription.tsx
│   │   └── Congratulations.tsx
│   ├── common/             # Shared components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ShieldAnimation.tsx
│   │   └── StatusBadge.tsx
│   └── layouts/            # Layout components
│       └── AppLayout.tsx
│
├── hooks/                  # Custom React hooks
│   ├── useAccount.ts       # Account data fetching
│   ├── useTelegram.ts      # Telegram WebApp integration
│   ├── useNavigation.ts    # Navigation logic
│   └── useHaptic.ts        # Haptic feedback
│
├── services/               # API & external services
│   ├── api.ts             # API client
│   ├── telegram.ts        # Telegram WebApp service
│   └── storage.ts         # LocalStorage wrapper
│
├── types/                  # TypeScript definitions
│   ├── account.ts         # Account types
│   ├── navigation.ts      # Navigation types
│   └── telegram.ts        # Telegram types
│
├── utils/                  # Helper functions
│   ├── formatters.ts      # Date, bytes formatting
│   ├── validators.ts      # Input validation
│   └── constants.ts       # App constants
│
├── styles/                 # Global styles
│   ├── theme.ts           # Mantine theme config
│   ├── globals.css        # Global CSS
│   └── animations.css     # CSS animations
│
├── App.tsx                 # Main app (clean, 50 lines)
└── main.tsx               # Entry point
```

## Benefits

### 1. Separation of Concerns
- UI components separate from logic
- Business logic in hooks
- API calls in services
- Types in dedicated files

### 2. Reusability
- Custom hooks reusable across components
- Common UI components
- Shared utilities

### 3. Maintainability
- Easy to find code
- Clear structure
- Smaller files (100-200 lines each)

### 4. Testability
- Hooks can be tested separately
- Services can be mocked
- Components easy to test

### 5. Scalability
- Easy to add new features
- Clear where to put new code
- Team-friendly structure

## Implementation Plan

### Phase 1: Create Infrastructure
- [x] Create folder structure
- [ ] Move types to types/
- [ ] Create services layer
- [ ] Create custom hooks

### Phase 2: Refactor Components
- [ ] Extract common components
- [ ] Move screens to components/screens/
- [ ] Create layout components

### Phase 3: Extract Logic
- [ ] Move API calls to services
- [ ] Create custom hooks for data fetching
- [ ] Extract utilities

### Phase 4: Cleanup
- [ ] Remove old files
- [ ] Update imports
- [ ] Test all features

## Estimated Time
- Phase 1: 1 hour
- Phase 2: 2 hours
- Phase 3: 1 hour
- Phase 4: 30 minutes

Total: ~4.5 hours

## Priority
🔴 **HIGH** - Current structure will become unmaintainable as app grows

