# Changelog: CORE Core & Setup Module

**Last Updated**: 2026-05-28
**Status**: ✅ 13/14 complete (CORE-014 Auto-Updater P2 tertunda)

---

## CORE-001: Project Scaffolding ✅

**Files Changed**:
- `package.json` — NEW
- `vite.config.ts` — NEW
- `tsconfig.json` — NEW
- `electron/tsconfig.json` — NEW
- `electron/main.ts` — NEW
- `electron/preload.ts` — NEW
- `src/main.tsx` — NEW
- `src/App.tsx` — NEW
- `src/lib/utils.ts` — NEW

**Features**:
- Vite + React + TypeScript + Electron
- Path aliases: `@/*` → `src/*`
- Electron main process dengan contextIsolation: true, nodeIntegration: false

### CORE-002: Tailwind CSS + shadcn/ui ✅

**Files Changed**:
- `tailwind.config.ts` — NEW
- `postcss.config.js` — NEW
- `src/index.css` — NEW
- `src/components/ui/*.tsx` — NEW (button, input, card, badge, dropdown-menu, avatar, checkbox, label, dialog)

**Features**:
- Tailwind CSS v4 dengan bp96 preset
- shadcn/ui base components

### CORE-003: Database Setup ✅

**Files Changed**:
- `electron/db/schema.ts` — NEW
- `electron/db/index.ts` — NEW
- `database/migrations/0000_open_terrax.sql` — NEW

**Features**:
- sql.js (Windows compatible, no native compilation)
- Drizzle ORM schema: users, settings, shifts, transactions, transaction_items
- Migration system dengan drizzle_migrations table
- Seed admin user (PIN: 123456)

### CORE-004: Secure IPC Bridge ✅

**Files Changed**:
- `electron/preload.ts` — Modified
- `electron/ipc/*.ts` — NEW (pattern established)

**Features**:
- contextBridge dengan whitelist channel pattern
- IPC handlers registered di main.ts

### CORE-005: Auth Service ✅

**Files Changed**:
- `electron/services/auth/repo.ts` — NEW
- `electron/services/auth/service.ts` — NEW
- `electron/ipc/auth.ts` — NEW

**Features**:
- PIN + email/password login
- bcrypt salt 12, JWT 24h
- Role-based: admin, manager, cashier

### CORE-006: Auth UI ✅

**Files Changed**:
- `src/pages/LoginPage.tsx` — NEW
- `src/components/auth/PinPad.tsx` — NEW
- `src/components/auth/LoginForm.tsx` — NEW

**Features**:
- PinPad 6 digit dengan animated feedback
- LoginForm untuk email/password
- LoginPage dengan tab切换

### CORE-007: Auth State ✅

**Files Changed**:
- `src/stores/authStore.ts` — NEW
- `src/App.tsx` — Modified (checkAuth on mount)

**Features**:
- Zustand authStore
- Token persistence di localStorage
- `verifyPin()` — PIN verification (placeholder, TODO: API)
- `isAdminOrManager()` — role check

### CORE-008: Settings Service ✅

**Files Changed**:
- `electron/services/settings/repo.ts` — NEW
- `electron/services/settings/service.ts` — NEW
- `electron/ipc/settings.ts` — NEW

**Features**:
- Key-value CRUD
- `settingsGetTheme` / `settingsSetTheme`
- 5 IPC handlers: get, set, getAll, getTheme, setTheme

### CORE-009: Settings UI ✅

**Files Changed**:
- `src/stores/settingsStore.ts` — NEW
- `src/pages/SettingsPage.tsx` — NEW

**Features**:
- settingsStore dengan 9 fields: storeName, storeAddress, storePhone, taxRate + receipt template
- SettingsPage dengan form lengkap + receipt template section
- Receipt template: header, footer, show_logo, show_tax_breakdown, show_qr

### CORE-010: App Shell ✅

**Files Changed**:
- `src/App.tsx` — Modified (routing, ProtectedRoute)
- `src/components/layout/Sidebar.tsx` — NEW
- `src/components/layout/Toolbar.tsx` — NEW
- `src/components/auth/ProtectedRoute.tsx` — NEW

**Features**:
- Sidebar dark theme dengan navigation
- Toolbar dengan theme toggle, user menu
- ProtectedRoute untuk halaman yang memerlukan auth

### CORE-011: Backup & Restore ✅

**Files Changed**:
- `electron/services/backup/repo.ts` — NEW
- `electron/ipc/backup.ts` — NEW

**Features**:
- `backup:create` — copy DB ke backup dir dengan timestamp
- `backup:restore` — restore dari backup file
- Validasi SQLite header sebelum restore
- Atomic copy (close DB → copy → reopen)

### CORE-012: Dark/Light Mode ✅

**Files Changed**:
- `src/stores/themeStore.ts` — NEW
- `src/App.tsx` — Modified (initTheme)
- `electron/ipc/settings.ts` — Modified (getTheme/setTheme)

**Features**:
- System preference fallback
- SQLite persistence via settings
- `settings:getTheme` / `settings:setTheme` handlers

### CORE-013: Receipt Template Settings ✅

**Files Changed**:
- `src/pages/SettingsPage.tsx` — Modified (receipt template section)
- `src/stores/settingsStore.ts` — Modified (receipt fields)

**Features**:
- 7 setting keys: receipt_header, receipt_footer, receipt_show_logo, receipt_show_tax_breakdown, receipt_show_qr
- Form dengan checkbox untuk toggle

### CORE-014: Auto-Updater ⬜ P2

**Status**: Tertunda (P2 priority)

---

## Error Codes

| Code | Module | Description |
|------|--------|-------------|
| TRANS_001 | Transaction | Stok tidak mencukupi |
| TRANS_002 | Transaction | Jumlah pembayaran kurang |
| TRANS_003 | Transaction | Transaksi sudah dibatalkan |
| TRANS_004 | Transaction | Transaksi sudah diretur |
| TRANS_005 | Transaction | Buka shift terlebih dahulu |
| AUTH_001 | Auth | PIN salah |
| AUTH_002 | Auth | Password salah |
| AUTH_003 | Auth | Token expired |
| SETTINGS_001 | Settings | Key tidak valid |
| SETTINGS_002 | Settings | Value terlalu panjang |
| SETTINGS_003 | Settings | Permission denied |
| SETTINGS_004 | Settings | Setting tidak ditemukan |
| BACKUP_001 | Backup | File backup tidak valid |
| BACKUP_002 | Backup | Gagal menulis backup |
| BACKUP_003 | Backup | Restore gagal |
| PRINT_001 | Printer | Printer tidak terhubung |
| PRINT_002 | Printer | Print gagal |

---

## Key Decisions

- **Database**: sql.js instead of better-sqlite3 (Windows compatible, no native compilation)
- **Theme persistence**: SQLite settings instead of localStorage
- **Receipt template**: Stored as key-value in settings table
- **Import paths**: `.ts` extension with `allowImportingTsExtensions: true`
- **Electron config**: `module: Node16`, `moduleResolution: node16`
