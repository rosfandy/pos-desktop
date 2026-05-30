# Progress: CORE Core & Setup

**Started**: 2026-05-28
**Last Updated**: 2026-05-28

**Status**: ✅ 13/14 COMPLETE (CORE-014 Auto-Updater P2 tertunda)

---

## Executive Summary

13 dari 14 task CORE sudah selesai. CORE-014 (Auto-Updater) tertunda P2.

**Quality Gates**:
```
npm run typecheck   → ✅ PASS (0 errors)
npm run lint        → ✅ PASS (0 errors)
```

---

## Task Files (13/14 complete)

| Kode | Deskripsi | Status |
|------|-----------|--------|
| CORE-001 | Scaffolding Project Electron + Vite + React + TypeScript | ✅ |
| CORE-002 | Setup Tailwind CSS + shadcn/ui Base Components | ✅ |
| CORE-003 | Setup Database: better-sqlite3 + Drizzle ORM + Foundation Schema | ✅ |
| CORE-004 | Secure IPC Bridge: Preload + Whitelist Pattern | ✅ |
| CORE-005 | Auth Service: PIN & Password Login with bcrypt + JWT | ✅ |
| CORE-006 | Auth UI: LoginPage + PinPad Components | ✅ |
| CORE-007 | Auth State Management: Zustand authStore | ✅ |
| CORE-008 | Settings Service: Key-Value CRUD IPC | ✅ |
| CORE-009 | Settings UI: Store Settings Form + SettingsPage | ✅ |
| CORE-010 | ProtectedRoute & App Shell Layout | ✅ |
| CORE-011 | Backup & Restore Database | ✅ |
| CORE-012 | Dark / Light Mode Toggle (integrated with SQLite settings) | ✅ |
| CORE-013 | Receipt Template Settings UI | ✅ |
| CORE-014 | Auto-Updater Skeleton (electron-updater) | ⬜ TODO (P2) |

---

## ✅ COMPLETE (13/14)

### CORE-001 — Project Scaffolding ✅
- Vite + React + TypeScript + Electron
- Tailwind CSS v4 + shadcn/ui bp96 preset
- Base components: button, input, card, badge, dropdown-menu, avatar

### CORE-002 — Tailwind + shadcn/ui ✅
- Tailwind v4 configured
- shadcn/ui bp96 preset
- Base components: button, input, card, badge, dropdown-menu, avatar, checkbox, label

### CORE-003 — Database ✅
- sql.js (Windows compatible)
- Drizzle ORM schema: users, settings, shifts, transactions, transaction_items
- Migration: `database/migrations/0000_open_terrax.sql`

### CORE-004 — Secure IPC Bridge ✅
- preload.ts dengan contextBridge
- Channel whitelist

### CORE-005 — Auth Service ✅
- PIN + email/password
- bcrypt salt 12, JWT 24h

### CORE-006 — Auth UI ✅
- PinPad + LoginForm + LoginPage

### CORE-007 — Auth State ✅
- Zustand authStore

### CORE-008 — Settings Service ✅
- repo.ts, service.ts, ipc/settings.ts
- 5 handlers: get, set, getAll, getTheme, setTheme

### CORE-009 — Settings UI ✅
- settingsStore.ts (9 fields: storeName, address, phone, taxRate + receipt template)
- SettingsPage.tsx (full form dengan receipt template section)

### CORE-010 — App Shell ✅
- Sidebar dark theme, toolbar, routing, ProtectedRoute

### CORE-011 — Backup & Restore ✅
- `electron/services/backup/repo.ts`
- `electron/ipc/backup.ts` — backup:create, backup:restore
- Validasi SQLite header, atomic copy, close DB before restore

### CORE-012 — Dark/Light Mode ✅
- `src/stores/themeStore.ts` — integrated dengan SQLite settings via IPC
- `settings:getTheme` / `settings:setTheme` handlers
- System preference fallback

### CORE-013 — Receipt Template Settings ✅
- Form di SettingsPage: header, footer, show/hide logo/tax/QR
- 7 setting keys: receipt_header, receipt_footer, receipt_show_logo, receipt_show_tax_breakdown, receipt_show_qr

---

## ⬜ TODO (1/14)

### CORE-014 — Auto-Updater (P2)
- electron-updater setup
- Check update on startup, download progress, install

---

## Blockers
- CORE-014 (P2) belum dikerjakan, tidak memblok modul lain

---

## Next Steps
- **CORE-008** → POS Terminal (prioritas tertinggi)
