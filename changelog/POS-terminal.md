# Changelog: POS Terminal Module

**Last Updated**: 2026-05-28
**Status**: 🟡 Phase 7/8 complete (POS-012, POS-013)

---

## Phase 7 — Void/Refund + Real Product API ✅

### POS-012: Void/Refund Transaction with Authorization

**Files Changed**:
- `src/components/pos/VoidRefundModal.tsx` — NEW
- `src/stores/authStore.ts` — Modified
- `electron/services/transaction/service.ts` — Modified
- `electron/services/product/service.ts` — Modified
- `electron/ipc/transaction.ts` — Unchanged
- `electron/preload.ts` — Unchanged
- `src/lib/api.ts` — Unchanged

**Features**:
- Modal untuk void/refund transaksi dengan PIN autorisasi manager/admin
- List transaksi terbaru (filter status 'completed')
- Toggle mode Void/Refund
- PIN input 6 digit dengan verifikasi
- Partial refund: pilih item dan qty untuk diretur
- Validasi: tidak bisa void/refund transaksi yang sudah voided/refunded
- Error TRANS_003 jika transaksi sudah dibatalkan
- Update stok produk saat refund/void (kembali ke inventori)

**Breaking Changes**: None

### POS-013: Integrate Product API to ProductGrid (Remove Mock)

**Files Changed**:
- `src/components/pos/ProductGrid.tsx` — Modified
- `src/hooks/useBarcode.ts` — Unchanged
- `electron/services/product/service.ts` — Modified
- `electron/db/schema.ts` — Modified (products table added earlier)
- `electron/ipc/product.ts` — Unchanged (already registered)
- `electron/preload.ts` — Modified (productUpdateStock added)
- `src/lib/api.ts` — Modified (productUpdateStock added)

**Features**:
- ProductGrid memuat produk dari database via `product:list` IPC
- Fallback ke mock data jika database kosong
- Barcode scanner mencari produk by barcode via `product:getByBarcode`
- Fuzzy search menggunakan data dari database
- `updateProductStock` IPC handler untuk update stok saat refund/void

**Breaking Changes**: None

---

## Previous Phases

### Phase 6 — Printer ESC/POS ✅ (POS-010)

**Files Changed**:
- `electron/services/printer/service.ts` — NEW
- `electron/ipc/printer.ts` — Unchanged (registered in main.ts)
- `electron/preload.ts` — Modified (printer channels added)
- `src/hooks/usePrinter.ts` — NEW
- `src/components/pos/ReceiptPreview.tsx` — Modified (print button added)
- `src/lib/api.ts` — Modified (printer API added)

**Features**:
- `printReceipt()` — format + print struk thermal 58mm
- `printTestPage()` — test print tanpa transaksi
- `openCashDrawer()` — ESC/POS pulse command
- `electron-pos-printer` library untuk thermal printing
- 3 IPC handlers: `printer:print`, `printer:test`, `printer:open-drawer`
- `usePrinter` hook di renderer

### Phase 5 — Keyboard Shortcuts + Hold Bill ✅ (POS-007, POS-011)

**Files Changed**:
- `src/hooks/useKeyboardShortcuts.ts` — NEW
- `src/components/pos/HoldBillModal.tsx` — NEW
- `src/stores/cartStore.ts` — Modified (add loadHeldBill, deleteHeldBill)

**Features**:
- Keyboard shortcuts: F2 (search), F4 (payment), F5 (hold), F6 (held bills), F7 (reprint), Escape (close)
- +/- untuk adjust qty, Delete/Backspace untuk remove item
- HoldBillModal: list bill ditahan, load/delete

### Phase 4 — Cart & Payment ✅ (POS-004, POS-005, POS-014)

**Files Changed**:
- `src/components/pos/CartPanel.tsx` — NEW
- `src/components/pos/PaymentModal.tsx` — NEW
- `src/components/pos/ReceiptPreview.tsx` — NEW

**Features**:
- CartPanel: items, qty controls, item discount, cart discount, tax, Bayar button
- PaymentModal: Cash/QRIS/Debit/Transfer, quick amounts, change calc
- ReceiptPreview: thermal receipt preview with print button

### Phase 3 — Layout & Product ✅ (POS-002, POS-003, POS-006)

**Files Changed**:
- `src/components/pos/POSTerminal.tsx` — NEW
- `src/components/pos/ProductGrid.tsx` — NEW (now uses real API in Phase 7)
- `src/hooks/useBarcode.ts` — NEW

### Phase 2 — Cart State ✅ (POS-001)

**Files Changed**:
- `src/stores/cartStore.ts` — NEW

### Phase 1 — Database Layer ✅ (POS-008, POS-009)

**Files Changed**:
- `electron/db/schema.ts` — Modified (transactions, transaction_items added)
- `electron/services/transaction/repo.ts` — NEW
- `electron/services/transaction/service.ts` — NEW
- `electron/ipc/transaction.ts` — NEW

---

## Database Schema Changes

### products table (added in Phase 7)
```sql
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  category TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  cost INTEGER DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  unit_conversion INTEGER DEFAULT 1,
  image TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);
```

### transactions table (added in Phase 1)
- `status` enum: 'completed' | 'held' | 'voided' | 'refunded'

---

## API Changes

### New IPC Channels
- `product:list` — list products with filter
- `product:getByBarcode` — get product by barcode
- `product:getById` — get product by ID
- `product:updateStock` — update product stock
- `printer:print` — print receipt
- `printer:test` — test print
- `printer:open-drawer` — open cash drawer

### New Renderer API Methods
- `window.api.productList(filter?)`
- `window.api.productGetByBarcode(barcode)`
- `window.api.productGetById(id)`
- `window.api.productUpdateStock(productId, quantityChange)`
- `window.api.printerPrint(data)`
- `window.api.printerTest()`
- `window.api.printerOpenDrawer()`

---

## Dependencies Added

- `electron-pos-printer` — thermal printer integration

---

## Phase 8b — Halaman Kasir Rebuild (2026-05-28) ✅

### POS-016: Rebuild Halaman Kasir — Table-based Product List

**Problem**: Halaman kasir sebelumnya (POSTerminalPage) memiliki banyak cacat:
- ProductGrid menggunakan layout card/grid yang tidak efisien untuk POS
- Kategori tab di sidebar (3-column layout) tidak dibutuhkan
- Modal Void/Refund muncul otomatis saat halaman dibuka (bug Base UI Dialog Portal)

**Files Changed**:
- `src/components/pos/ProductTable.tsx` — NEW (menggantikan ProductGrid)
- `src/pages/POSTerminalPage.tsx` — FULL REWRITE
- `src/components/pos/CartPanel.tsx` — POLISH
- `src/components/pos/VoidRefundModal.tsx` — BUG FIX
- `src/components/pos/POSTerminal.tsx` — DEPRECATED (tidak dipakai lagi)

### ProductTable (NEW)
- **Table layout** dengan kolom: No | Kode/Barcode | Nama | Harga | Stok | Aksi
- **Search by name/barcode/id** — input di atas tabel, F2 untuk focus
- **Sortable columns** — klik header untuk sort asc/desc
- **Keyboard nav** — Arrow Up/Down highlight, Enter tambah ke keranjang
- **Flash feedback** — baris ditambah flash hijau 400ms
- **Stok warning** — merah ≤5, kuning ≤20
- **Tidak ada kategori tab** — semua produk ditampilkan, dicari via search

### POSTerminalPage (REBUILT)
- **2-column layout** — produk kiri (60%), keranjang kanan (400px fixed)
- Kategori tab dihapus sepenuhnya
- Toast dengan tipe success/error/info
- ReceiptPreview sebagai modal overlay
- Toolbar: Test Print, Void/Refund, Tahan Bill

### VoidRefundModal (BUG FIX)
- `mounted` state — return `null` sampai `open={true}` secara eksplisit
- Reset state internal saat dibuka (selectedTx, pin, authorized, refundItems, mode)
- Delay unmount 350ms saat ditutup
- Prop `modal` pada Dialog untuk mencegah close saat klik luar

### CartPanel (POLISH)
- Badge jumlah item di header
- Empty state lebih deskriptif
- Tombol Bayar h-11 dengan hint F4

### New Renderer API Methods
- `window.api.productList(filter?)`
- `window.api.productGetByBarcode(barcode)`
- `window.api.productGetById(id)`
- `window.api.productUpdateStock(productId, quantityChange)`
- `window.api.printerPrint(data)`
- `window.api.printerTest()`
- `window.api.printerOpenDrawer()`

---

## Dependencies Added

- `electron-pos-printer` — thermal printer integration
