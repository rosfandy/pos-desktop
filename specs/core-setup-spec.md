# Technical Spec: Core & Setup

## 1. Overview

Foundation module untuk POS Desktop. Menyediakan project scaffolding, database setup, autentikasi, dan pengaturan aplikasi.

**Linked PRD Sections**: 7.1, 7.2, 7.3, 7.4, 7.5 (users, settings), 5.6, 5.7

---

## 2. Architecture

```
electron/
├── main.ts                 # Entry point, window management
├── preload.ts              # IPC bridge (contextIsolation)
├── ipc/
│   ├── auth.ts             # Auth IPC handlers
│   └── settings.ts         # Settings IPC handlers
├── db/
│   ├── index.ts            # Database connection (better-sqlite3)
│   ├── schema.ts           # Drizzle schema definitions
│   └── migrations/         # Migration files
└── services/
    ├── auth/
    │   ├── repo.ts         # User repository
    │   └── service.ts      # Auth business logic
    └── settings/
        ├── repo.ts         # Settings repository
        └── service.ts      # Settings business logic

src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── PinPad.tsx
│   └── settings/
│       └── SettingsForm.tsx
├── pages/
│   ├── LoginPage.tsx
│   └── SettingsPage.tsx
├── stores/
│   ├── authStore.ts
│   └── settingsStore.ts
└── lib/
    └── api.ts              # IPC wrapper
```

---

## 3. Data Models

### Users Table

```typescript
// electron/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  pin: text('pin'),                          // 6-digit PIN for quick login
  passwordHash: text('password_hash'),       // bcrypt hash for password
  role: text('role', { enum: ['admin', 'manager', 'cashier'] }).notNull().default('cashier'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Settings Table

```typescript
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

### Session / Shift Table

```typescript
export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  openedAt: integer('opened_at', { mode: 'timestamp' }).notNull(),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  openingCash: integer('opening_cash').notNull().default(0),    // in cents (rupiah * 100)
  closingCash: integer('closing_cash'),
  totalSales: integer('total_sales').notNull().default(0),
  status: text('status', { enum: ['open', 'closed'] }).notNull().default('open'),
});
```

---

## 4. API / IPC Contract

```typescript
// electron/preload.ts - Whitelisted channels
interface API {
  // Auth
  'auth:login': (credentials: { pin: string } | { email: string; password: string }) => Promise<{ user: User; token: string }>;
  'auth:logout': () => Promise<void>;
  'auth:me': () => Promise<User | null>;
  
  // Settings
  'settings:get': (key: string) => Promise<string | null>;
  'settings:set': (key: string, value: string) => Promise<void>;
  'settings:getAll': () => Promise<Record<string, string>>;
  
  // Shift
  'shift:open': (data: { openingCash: number; userId: string }) => Promise<Shift>;
  'shift:close': (data: { closingCash: number; shiftId: string }) => Promise<Shift>;
  'shift:current': () => Promise<Shift | null>;
}
```

---

## 5. State Management

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  
  login: async (credentials) => {
    const { user, token } = await window.api.authLogin(credentials);
    localStorage.setItem('token', token);
    set({ user, isAuthenticated: true });
  },
  
  logout: async () => {
    await window.api.authLogout();
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },
  
  checkAuth: async () => {
    const user = await window.api.authMe();
    set({ user, isAuthenticated: !!user, isLoading: false });
  },
}));
```

```typescript
// src/stores/settingsStore.ts
interface SettingsState {
  settings: Record<string, string>;
  storeName: string;
  storeAddress: string;
  taxRate: number;
  
  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}
```

---

## 6. Component Structure

### Auth Components
```
src/components/auth/
├── LoginForm.tsx          # Email/password or PIN login
├── PinPad.tsx             # Numeric keypad for PIN
└── ProtectedRoute.tsx     # Route guard for authenticated pages
```

### Settings Components
```
src/components/settings/
├── StoreSettingsForm.tsx  # Store name, address, logo, tax
├── PrinterSettings.tsx    # Thermal printer setup, test print
├── ReceiptTemplate.tsx    # Customize receipt output
└── BackupRestore.tsx      # Database backup/restore
```

---

## 7. Error Handling

| Error Code | Description | User Message (ID) |
|------------|-------------|-------------------|
| AUTH_001 | Invalid PIN | "PIN tidak valid" |
| AUTH_002 | Invalid password | "Email atau password salah" |
| AUTH_003 | User inactive | "Akun tidak aktif, hubungi admin" |
| SHIFT_001 | Shift already open | "Shift sudah dibuka" |
| SHIFT_002 | No open shift | "Tidak ada shift yang aktif" |
| SETTINGS_001 | Key not found | "Pengaturan tidak ditemukan" |

---

## 8. Testing Strategy

### Unit Tests (Vitest)
- `auth.service.test.ts` - Hash comparison, token generation
- `settings.repo.test.ts` - CRUD operations
- `shift.service.test.ts` - Open/close shift logic

### E2E Tests (Playwright)
- Login flow with PIN
- Login flow with email/password
- Settings persistence after restart
- Shift open/close workflow

---

## 9. Security Considerations

- **Password Hashing**: bcrypt with salt rounds 12
- **PIN Storage**: Hashed (not encrypted), 6 digits
- **Session Token**: JWT with 24h expiry, stored in localStorage
- **Context Isolation**: All IPC goes through preload.ts whitelist
- **No Node Integration**: Renderer cannot access Node.js APIs
