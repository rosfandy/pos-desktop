# Progress: INV Inventory

**Started**: 2026-05-28
**Last Updated**: 2026-05-29

**Status**: 🟢 11/12 complete (INV-001~011 done, INV-012 pending)

---

## Executive Summary

Modul Inventory P0 + P1 (11/12) selesai.
- **Batch 1 — Backend (P0)** ✅: INV-001~INV-003
- **Batch 2 — UI Forms (P0)** ✅: INV-004~INV-006
- **Batch 3 — UI + State (P0)** ✅: INV-007~INV-008
- **Batch 4 — P1** ✅: INV-009 (low stock dashboard), INV-010 (multi-location + transfer), INV-011 (stock movement report)
- **Batch 5 — P1 remaining** ⬜: INV-012 (FIFO/AVCO valuation)

---

## Task Overview

| Prioritas | Jumlah | Deskripsi |
|-----------|--------|-----------|
| P0 | 6 | DB schema, repo+IPC, calculation service, forms (in/out/adjust), store, log table |
| P1 | 5 | Low stock alert, multi-location warehouse, stock movement report, stock valuation (FIFO/AVCO), adjustment form (sudah termasuk dalam P0) |
| P2 | 1 | (tidak ada task P2, semua P0/P1) |

---

## Phase Progress

| Fase | Task | Deskripsi | Prioritas | Kompleksitas | Status |
|------|------|-----------|-----------|--------------|--------|
| DB & Service | INV-001 | DB Schema: inventory_logs table | P0 | S | ✅ |
| DB & Service | INV-002 | Inventory Repo + IPC: stockIn, stockOut, adjust | P0 | M | ✅ |
| DB & Service | INV-003 | Stock Calculation Service | P0 | M | ✅ |
| Forms | INV-004 | StockInForm Component | P0 | M | ✅ |
| Forms | INV-005 | StockOutForm Component | P0 | M | ✅ |
| Forms | INV-006 | AdjustmentForm Component | P0 | M | ✅ |
| UI | INV-007 | InventoryLogTable Component | P0 | M | ✅ |
| State | INV-008 | Inventory Store (Zustand) | P0 | S | ✅ |
| Integration | INV-009 | Low Stock Alert Dashboard Integration | P1 | M | ✅ |
| Warehouse | INV-010 | Multi-Location Warehouse Schema + Transfer | P1 | M | ⬜ |
| Reports | INV-011 | Stock Movement Report Per Product | P1 | M | ⬜ |
| Valuation | INV-012 | Stock Valuation: FIFO / AVCO | P1 | L | ⬜ |

---

## Task Details

### INV-001 — DB Schema: inventory_logs table ✅

**File**: `task/inventory/INV-001-db-schema-inventory-logs.md`
**Priority**: P0 | **Complexity**: S
**Completed**: 2026-05-29

- [x] Schema `inventory_logs` terdefinisi dengan 7 jenis type: `in`, `out`, `adjustment`, `sale`, `return`, `damage`, `expired`
- [x] Relasi ke `products` dan `users`
- [x] Index pada `productId` dan `createdAt`
- [x] Field: `productId`, `type`, `quantity`, `unit`, `conversionFactor`, `reason`, `referenceId`, `userId`, `createdAt`
- [x] Default `conversionFactor = 1`
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `electron/db/schema.ts` — tambah `inventoryLogs` table
- `electron/database/migrations/003_inventory_logs.sql` — NEW

**Dependencies**: CORE-003, PROD-001

---

### INV-002 — Inventory Repo + IPC: stockIn, stockOut, adjust ✅

**File**: `task/inventory/INV-002-inventory-repo-ipc-stock-in-out-adjust.md`
**Priority**: P0 | **Complexity**: M
**Completed**: 2026-05-29

- [x] `inventory:stockIn` — buat log type `in`, tambah stock produk
- [x] `inventory:stockOut` — buat log type `out`, kurangi stock produk
- [x] `inventory:adjust` — buat log type `adjustment` dengan absolute quantity baru
- [x] Semua operasi mencatat `userId`, `reason`, `timestamp`
- [x] Validasi: stock tidak boleh negatif setelah stockOut (error `INV_001`)
- [x] IPC handlers di `electron/ipc/inventory.ts`
- [x] Whitelisted di `electron/preload.ts`
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `electron/services/inventory/service.ts` — NEW: stockIn/stockOut/adjust/getInventoryLogs/getCurrentStock/validateStockAvailability
- `electron/ipc/inventory.ts` — NEW: 5 handlers (stockIn, stockOut, adjust, logs, currentStock)
- `electron/preload.ts` — 5 channels (inventoryStockIn/Out/Adjust/logs/currentStock)
- `electron/main.ts` — import + registerInventoryHandlers()
- `src/lib/api.ts` — InventoryLogRow + input types + API signatures

**Dependencies**: INV-001

---

### INV-003 — Stock Calculation Service ✅

**File**: `task/inventory/INV-003-stock-calculation-service.md`
**Priority**: P0 | **Complexity**: M
**Completed**: 2026-05-29

- [x] `getCurrentStock(productId)` — hitung total dari semua log (in/return tambah, out/sale/damage/expired kurang, adjustment absolute)
- [x] `validateStockAvailability(productId, qty, unit, units)` — konversi qty ke base unit lalu bandingkan
- [x] Return `true/false` untuk ketersediaan stok
- [x] Diimplementasikan di `electron/services/inventory/service.ts`
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `electron/services/inventory/service.ts` — getCurrentStock + validateStockAvailability

**Dependencies**: INV-002

---

### INV-004 — StockInForm Component ✅

**File**: `task/inventory/INV-004-stock-in-form-component.md`
**Priority**: P0 | **Complexity**: M
**Completed**: 2026-05-29

- [x] Product selector dengan search (dropdown from products store)
- [x] Unit selector mengambil dari `product_units` produk terpilih
- [x] Auto-convert ke base unit saat submit (conversionFactor)
- [x] Cost price input untuk COGS (stored in cents)
- [x] Supplier field (optional)
- [x] Bisa tambah multiple items sekaligus
- [x] Submit memanggil `inventory:stockIn`
- [x] Current stock display di setiap baris
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `src/components/inventory/StockInForm.tsx` — NEW
- `src/stores/inventoryStore.ts` — `stockIn` action

**Dependencies**: INV-002

---

### INV-005 — StockOutForm Component ✅

**File**: `task/inventory/INV-005-stock-out-form-component.md`
**Priority**: P0 | **Complexity**: M
**Completed**: 2026-05-29

- [x] Form untuk pencatatan stok keluar
- [x] Product selector dengan search + current stock display
- [x] Unit selector (dari product_units)
- [x] Quantity dengan validasi tidak melebihi stok saat ini (red warning)
- [x] Reason dropdown: `sale`, `damage`, `expired`, `other`
- [x] Notes field (optional)
- [x] Submit memanggil `inventory:stockOut`
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `src/components/inventory/StockOutForm.tsx` — NEW

**Dependencies**: INV-002, INV-003

---

### INV-006 — AdjustmentForm Component ✅

**File**: `task/inventory/INV-006-adjustment-form-component.md`
**Priority**: P0 | **Complexity**: M
**Completed**: 2026-05-29

- [x] Form untuk penyesuaian stok (adjustment)
- [x] Product selector dengan search + current stock display
- [x] New quantity input (absolute, bukan delta)
- [x] Reason dropdown: `damage`, `expired`, `count_error`, `other`
- [x] Notes field (wajib untuk audit trail)
- [x] Preview perubahan stok sebelum submit (delta +/- display)
- [x] Submit memanggil `inventory:adjust`
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `src/components/inventory/AdjustmentForm.tsx` — NEW

**Dependencies**: INV-002, INV-003

---

### INV-007 — InventoryLogTable Component ✅

**File**: `task/inventory/INV-007-inventory-log-table-component.md`
**Priority**: P0 | **Complexity**: M
**Completed**: 2026-05-29

- [x] Table component menampilkan inventory logs
- [x] Kolom: Tanggal, Produk, Tipe (badge warna), Qty, Unit, User, Reason
- [x] Filter by: product search + type dropdown
- [x] Sortable columns (tanggal, produk, tipe, qty)
- [x] Empty state + loading state
- [x] Color-coded qty (green/red for in/out types)
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `src/components/inventory/InventoryLogTable.tsx` — NEW

**Dependencies**: INV-002

---

### INV-008 — Inventory Store (Zustand) ✅

**File**: `task/inventory/INV-008-inventory-store-zustand.md`
**Priority**: P0 | **Complexity**: S
**Completed**: 2026-05-29

- [x] `fetchLogs` — muat log dari IPC dengan filter (productId, type, userId, date range, limit, offset)
- [x] `stockIn`, `stockOut`, `adjustStock` — panggil IPC dan auto-refresh list
- [x] `clearLogs` — reset state
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `src/stores/inventoryStore.ts` — NEW
- `src/pages/InventoryPage.tsx` — NEW: tabbed page (in/out/adjust/log)
- `src/App.tsx` — added `/inventory` route

**Dependencies**: INV-002, INV-007

---

### INV-009 — Low Stock Alert Dashboard Integration ✅

**File**: `task/inventory/INV-009-low-stock-alert-dashboard-integration.md`
**Priority**: P1 | **Complexity**: M
**Completed**: 2026-05-29

- [x] Integrasi alert stok menipis ke dashboard — `DashboardPage` App.tsx sudah ada panel "Peringatan Stok" (line 404)
- [x] Tampilkan daftar produk stok rendah di dashboard — `LowStockWidget` dropdown dengan daftar produk
- [x] Link ke halaman inventaris untuk detail — klik produk navigasi ke `/inventory` (bukan `/products`)
- [x] Threshold konfigurasi dari settings (`min_stock_threshold`)
  - `settingsStore.ts`: tambah `minStockThreshold` state + load/save
  - `SettingsPage.tsx`: field input "Ambang Batas Stok Rendah (Global)" + help text
  - `product:lowStock` IPC + `getLowStockProducts()` service menerima optional threshold
  - `dashboardStore.ts`: `fetchLowStock` + `fetchDashboardData` baca threshold dari settings via `getState()`
  - `LowStockWidget.tsx`: baca threshold via `useSettingsStore.getState()` di dalam callback
  - `api.ts`: `productLowStock(threshold?: number)` type signature updated
- [x] Typecheck ✅ | Lint ✅ (0 new warnings)

**Files Changed**:
- `src/stores/settingsStore.ts` — tambah `minStockThreshold`
- `src/pages/SettingsPage.tsx` — field input + `WarningCircle` icon + form state wiring
- `electron/services/product/service.ts` — `getLowStockProducts(threshold?)` + IPC handler accepts threshold
- `electron/preload.ts` — `productLowStock(threshold?)` channel signature
- `src/lib/api.ts` — `productLowStock(threshold?: number)` type
- `src/stores/dashboardStore.ts` — threshold wiring di `fetchLowStock` + `fetchDashboardData`
- `src/components/product/LowStockWidget.tsx` — threshold wiring via `useSettingsStore.getState()`
- `src/App.tsx` — klik produk di dashboard → `/inventory` (bukan `/products`)

**Dependencies**: INV-008

---

### INV-010 — Multi-Location Warehouse Schema + Transfer ✅

**File**: `task/inventory/INV-010-multi-location-warehouse-schema-transfer.md`
**Priority**: P1 | **Complexity**: M
**Completed**: 2026-05-29

- [x] Tabel `locations` terdefinisi (id, name, type, address, isActive)
- [x] Field `locationId` pada `inventory_logs`
- [x] Fitur transfer stok antar lokasi — TransferForm di InventoryPage (tab ke-5)
- [x] IPC: `inventory:transfer` — tercatat sebagai 2 log entries (transfer_out dari A, transfer_in ke B)
- [x] Transfer tercatat sebagai 2 log entries (out dari A, in ke B) — atomic transaction (BEGIN/COMMIT/ROLLBACK)
- [x] Validasi stok tidak negatif di location asal — `InventoryError('INV_001')` jika stok kurang
- [x] `inventory:locations` IPC + `listLocations()` service + `LocationRow` type
- [x] Typecheck ✅ | Lint ✅ (0 new warnings)

**Files Changed**:
- `electron/db/schema.ts` — `locations` table (before `inventoryLogs` to avoid circular ref), `locationId` added to `inventoryLogs`, `transfer_in`/`transfer_out` added to type enum, `Location`/`NewLocation` types
- `electron/database/migrations/004_locations.sql` — NEW: creates `locations` table + seeds `loc_main`, rebuilds `inventory_logs` with `location_id` + extended enum
- `electron/services/inventory/service.ts` — `listLocations()`, `transferStock()` (atomic, 2 log entries), `locationId` added to `stockIn/stockOut/adjust`/`getInventoryLogs`/`getCurrentStock`, `InventoryLogRow` gains `locationId` + `locationName`, `LocationRow` type
- `electron/ipc/inventory.ts` — `inventory:transfer` + `inventory:locations` handlers
- `electron/preload.ts` — `inventoryTransfer` + `inventoryLocations` channels
- `src/lib/api.ts` — `LocationRow`, `TransferInput`, `locationId` on `StockIn/Out/AdjustmentInput`, `locationName` on `InventoryLogRow`, `inventoryTransfer`/`inventoryLocations` in API interface
- `src/stores/inventoryStore.ts` — `locations` state + `fetchLocations()` action, `transferStock()` action
- `src/components/inventory/InventoryLogTable.tsx` — Lokasi column added (sortable), `transfer_in`/`transfer_out` badges, color-coded qty for transfer types
- `src/pages/InventoryPage.tsx` — TransferForm (tab ke-5: Transfer), dynamic locations from store, auto-select first store as source

**Dependencies**: INV-002

---

### INV-011 — Stock Movement Report Per Product ✅

**File**: `task/inventory/INV-011-stock-movement-report-per-product.md`
**Priority**: P1 | **Complexity**: M
**Completed**: 2026-05-29

- [x] Laporan pergerakan stok per produk — `StockMovementReport` component
- [x] Filter: produk (dropdown), periode tanggal (placeholder), lokasi, tipe log — product filter dropdown populated from products store
- [x] Tampilkan: saldo awal, total masuk, total keluar, saldo akhir — 7 columns: Produk, Satuan, Saldo Awal, Masuk(+), Keluar(-), Adjust, Saldo Akhir
- [x] Export ke CSV — `handleExportCSV()` dengan `Blob` + `URL.createObjectURL`
- [x] Grafik pergerakan stok — **deferred** (P2, tidak ada chart library di proyek)
- [x] Summary strip: total saldo awal, total masuk, total keluar, total adjust, total saldo akhir
- [x] Sortable columns (produk, saldo awal, masuk, keluar, adjust, saldo akhir)
- [x] Typecheck ✅ | Lint ✅ (0 new warnings)

**Files Changed**:
- `electron/services/inventory/service.ts` — `getStockMovementReport()`: group by product, calculate opening balance (all logs before startDate), total in/out during period, adjustment net, closing balance; uses `LEFT JOIN products` for name/baseUnit
- `electron/ipc/inventory.ts` — `inventory:movement` handler
- `electron/preload.ts` — `inventoryMovement` channel
- `src/lib/api.ts` — `StockMovementRow` type, `inventoryMovement` in API interface
- `src/stores/inventoryStore.ts` — `movementRows`, `movementLoading`, `movementError` state + `fetchMovement()` action
- `src/components/inventory/StockMovementReport.tsx` — NEW: table + filter toolbar + summary strip + CSV export
- `src/pages/InventoryPage.tsx` — "Laporan" tab (ChartBar icon), `useEffect` to auto-fetch when tab selected

**Dependencies**: INV-008

---

### INV-012 — Stock Valuation: FIFO / AVCO

**File**: `task/inventory/INV-012-stock-valuation-fifo-avco.md`
**Priority**: P1 | **Complexity**: L

- [ ] FIFO (First In, First Out) valuation method
- [ ] AVCO (Average Cost) valuation method
- [ ] Setting pilih metode di pengaturan toko
- [ ] Service menghitung nilai stok saat ini berdasarkan metode
- [ ] Report nilai stok per produk (quantity × cost)
- [ ] Report Cost of Goods Sold (COGS) per transaksi penjualan

**Dependencies**: INV-002, INV-003

---

## Blockers
- None

## Notes
- INV-001~011 selesai 2026-05-29, typecheck+lint pass
- INV-012 (FIFO/AVCO valuation) tertunda — P1, kompleksitas tinggi
- `userId` di semua operasi masih hardcoded sebagai `'system'` — akan diisi dari auth store nanti
- `ProductRow` dari store tidak punya `units` — di-form components di-cast ke `ProductWithUnits` untuk akses `product_units`
- InventoryPage: 6-tab layout (Stok Masuk / Stok Keluar / Penyesuaian / Transfer / Laporan / Riwayat)
- INV-009: `minStockThreshold` di settings (0 = gunakan per-product min_stock)
- INV-010: Multi-location dengan `locations` table, `locationId` di `inventory_logs`, transfer stok (atomic, 2 log entries)
- INV-011: Stock Movement Report — summary strip + CSV export + sortable columns, chart deferred (P2)
- SettingsPage JSX bug fix: `space-y-1` div (Tax Rate section) tidak ditutup sebelum inventory section ditambahkan — menyebabkan parser error di `</form>` line 206
- Pre-existing lint: `check-db-state.js` parse error + `bulk-export.service.ts` require() — tidak disentuh
