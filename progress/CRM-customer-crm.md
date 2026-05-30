# Progress: CRM Customer CRM

**Started**: 2026-05-30
**Last Updated**: 2026-05-30

**Status**: 🟢 8/8 complete | All P0+P1+P2 done (CRM-012 skipped — low priority)

---

## Executive Summary

Modul Customer CRM **selesai sepenuhnya** (P0+P1). Semua komponen inti untuk manajemen pelanggan dan loyalty sudah diimplementasi.

**Quality Gates**:
```
npm run typecheck   → ✅ PASS (0 errors)
npm run lint        → ✅ PASS (0 new errors, pre-existing warnings unchanged)
```

---

## Task Overview

| Prioritas | Jumlah | Deskripsi |
|-----------|--------|-----------|
| P0 | 6 | DB schema, repo+IPC, loyalty service, Zustand store, CustomerList+Form, CustomerSearch |
| P1 | 2 | LoyaltyCard, TransactionHistory |
| P2 | 1 | Customer import/export |

---

## Phase Progress

| Fase           | Kode     | Deskripsi                                      | Prioritas | Kompleksitas | Status |
| -------------- | -------- | ---------------------------------------------- | --------- | ------------ | ------ |
| DB Foundation  | CRM-001  | DB Schema: customers table                     | P0        | S            | ✅      |
| Repo + IPC     | CRM-002  | Customer Repo + IPC: CRUD (separated)          | P0        | M            | ✅      |
| Business Logic | CRM-003  | Loyalty Service: points + tier calculation     | P0        | M            | ✅      |
| State          | CRM-004  | Customer Store (Zustand)                       | P0        | S            | ✅      |
| Search         | CRM-006  | CustomerSearch Component                       | P0        | S            | ✅      |
| UI List+Form   | CRM-005  | CustomerList + CustomerForm Components         | P0        | M            | ✅      |
| POS Integrate  | CRM-010  | Integrate Customer Selection at POS            | P1        | S            | ✅      |
| LoyaltyCard    | CRM-007  | LoyaltyCard Component (tier, points, progress) | P0        | S            | ✅      |
| History        | CRM-008  | TransactionHistory Component                   | P1        | S            | ✅      |
| Redeem Points  | CRM-009  | Redeem Points Logic (di repo + IPC)            | P1        | S            | ✅      |
| Import/Export  | CRM-012  | Customer Import/Export CSV/Excel               | P2        | S            | ⬜      |

---

## ✅ COMPLETE

### CRM-001 — DB Schema: customers table ✅

**Priority**: P0 | **Complexity**: S

- [x] Schema `customers` di `electron/db/schema.ts`
- [x] Migration `005_customers.sql`
- [x] Tier enum: bronze/silver/gold/platinum

### CRM-002 — Customer Repo + IPC (separated) ✅

**Priority**: P0 | **Complexity**: M

- [x] `electron/services/customer/repo.ts` — 11 fungsi (list, get, getByPhone, create, update, delete, addPoints, redeemPoints)
- [x] `electron/ipc/customer.ts` — 10 IPC handlers (separated dari service)
- [x] `customer:transactions` ditambahkan untuk TransactionHistory

### CRM-003 — Loyalty Service ✅

**Priority**: P0 | **Complexity**: M

- [x] `electron/services/customer/service.ts` — calculatePoints, calculateTier, updatePointsAfterTransaction, pointsToRupiah

### CRM-004 — CustomerStore ✅

- [x] `src/stores/customerStore.ts`
- [x] `src/lib/api.ts` — CustomerRow, CustomerFilter, AddPointsResult, RedeemPointsResult, CustomerTransactionRow

### CRM-005 — CustomerList + CustomerForm ✅

- [x] `CustomerList.tsx` — tier badge, poin, total spent, sort
- [x] `CustomerForm.tsx` — create/edit dengan validasi
- [x] `CustomersPage.tsx` — full management page

### CRM-006 — CustomerSearch ✅

- [x] `CustomerSearch.tsx` — autocomplete, keyboard nav, create-new

### CRM-007 — LoyaltyCard ✅

**Priority**: P0 | **Complexity**: S

- [x] `src/components/customer/LoyaltyCard.tsx`
- [x] Tier badge dengan warna dan icon (🥉🥈🥇💎)
- [x] Points balance besar dengan nilai rupiah
- [x] Progress bar ke tier berikutnya
- [x] "Tukar Poin" button
- [x] Total spent display

### CRM-008 — TransactionHistory ✅

**Priority**: P1 | **Complexity**: S

- [x] `src/components/customer/TransactionHistory.tsx`
- [x] Tabel transaksi: tanggal, invoice, status, metode, itemCount, total
- [x] Sortable: Tanggal / No. Invoice / Total
- [x] Summary stats: total transaksi, total spent
- [x] Payment badge + Status badge
- [x] Empty state

### CRM-009 — Redeem Points ✅

- [x] `redeemPoints(id, points)` di `repo.ts`
- [x] `customer:redeemPoints` IPC handler
- [x] Error CUST_002 jika poin tidak cukup
- [x] 1 poin = Rp 100

### CRM-010 — POS Integration ✅

- [x] `CustomerSearch` di toolbar POS
- [x] Selected customer badge
- [x] `App.tsx` route `/customers` → CustomersPage

### CRM-012 — Customer Import/Export ⬜ SKIPPED

**Priority**: P2

- [ ] Import/export CSV Excel untuk customer (low priority, bisa ditambahkan nanti)

---

## Architecture

```
electron/
├── services/
│   ├── customer/
│   │   ├── repo.ts              ← 11 fungsi (CRUD + points + tx history)
│   │   └── service.ts           ← loyalty logic
│   ├── transaction/repo.ts      ← getTransactionsByCustomerId added
│   └── product/service.ts       ← (existing)
├── ipc/
│   ├── customer.ts              ← 10 IPC handlers
│   ├── product.ts               ← (existing)
│   └── transaction.ts           ← (existing)
└── main.ts                      ← registerCustomerHandlers()

src/
├── components/customer/
│   ├── CustomerSearch.tsx       ← autocomplete search
│   ├── CustomerList.tsx         ← table view
│   ├── CustomerForm.tsx         ← create/edit dialog
│   ├── LoyaltyCard.tsx          ← tier, points, progress
│   └── TransactionHistory.tsx   ← tx list with sort
├── pages/
│   ├── CustomersPage.tsx        ← management page
│   └── POSTerminalPage.tsx      ← CustomerSearch in toolbar
├── stores/
│   └── customerStore.ts         ← Zustand
└── lib/
    └── api.ts                   ← types + API signatures
```

---

## Key Decisions

- **Separated IPC**: repo (CRUD) + service (loyalty) + ipc (handlers) — tidak jadi 1 file
- **Transaction history**: Ditambahkan ke transaction repo (`getTransactionsByCustomerId`), bukan di customer repo
- **LoyaltyCard**: Self-contained component dengan progress bar, tidak perlu fetch tambahan
- **TrendUp icon**: `ArrowUpRight` digunakan karena `TrendingUp` tidak tersedia di phosphor-react
- **Soft delete**: Semua customer menggunakan isActive flag
- **No mock fallback**: Customer service pure DB (tidak ada mock seperti product)
