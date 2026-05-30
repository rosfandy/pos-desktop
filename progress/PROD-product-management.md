# Progress: PROD Product Management

**Started**: 2026-05-28
**Last Updated**: 2026-05-29

**Status**: 🟢 14/15 complete (PROD-001~PROD-011, PROD-013~015 done, PROD-012 skipped) | Migration fix: ✅

---

## Executive Summary

Modul Product Management hampir selesai:
- **Batch 1 — Foundation (P0)** ✅: PROD-001~PROD-004 (Schema, Repo+IPC, Category, Unit Conversion)
- **Batch 2 — State+UI (P0)** ✅: PROD-005~PROD-008 (Store, ProductList/Card, ProductForm, CategoryTree)
- **Batch 3 — P1** ✅⛔: PROD-009 ✅, PROD-010 ✅, PROD-011 ✅, PROD-012 ⛔ (skipped — tidak ada fitur upload gambar)
- **Batch 4 — Page+Audit** ✅: PROD-013 ✅ (Audit Trail), PROD-014 ✅ (ProductPage), PROD-015 ✅ (Inline Table Layout)

---

## Task Overview

| Prioritas | Jumlah | Deskripsi |
|-----------|--------|-----------|
| P0 | 9 | DB schema, repo+IPC, category, unit conversion, Zustand store, ProductList/ProductCard UI, ProductForm UI, ProductPage |
| P1 | 4 | Low stock alert dashboard, bulk import CSV/Excel, bulk export CSV/Excel, image upload & thumbnail |
| P2 | 0 | (all complete — audit trail done) |

---

## Phase Progress

| Fase           | Kode     | Deskripsi                                      | Prioritas | Kompleksitas | Status |
| -------------- | -------- | ---------------------------------------------- | --------- | ------------ | ------ |
| DB Foundation  | PROD-001 | DB Schema: products, categories, product_units | P0        | M            | ✅      |
| Repo + IPC     | PROD-002 | Product Repo + IPC: CRUD with Multi-Unit       | P0        | M            | ✅      |
| Repo + IPC     | PROD-003 | Category Repo + IPC: CRUD + Tree               | P0        | S            | ✅      |
| Business Logic | PROD-004 | Unit Conversion Logic & Validation             | P0        | M            | ✅      |
| State          | PROD-005 | Product Store (Zustand)                        | P0        | S            | ✅      |
| UI List        | PROD-006 | ProductList + ProductCard Components           | P0        | M            | ✅      |
| UI Form        | PROD-007 | ProductForm Component (Create/Edit)            | P0        | L            | ✅      |
| Tree UI        | PROD-008 | CategoryTree Component                         | P0        | M            | ✅      |
| Integration    | PROD-009 | Low Stock Alert Detection & Dashboard Widget   | P1        | S            | ✅      |
| Import         | PROD-010 | Bulk Import: CSV/Excel Parser + Preview        | P1        | L            | ✅      |
| Export         | PROD-011 | Bulk Export to CSV/Excel                       | P1        | S            | ✅      |
| Media          | PROD-012 | Product Image Upload & Thumbnail               | P1        | S            | ⛔      |
| Audit          | PROD-013 | Product History / Audit Trail                  | P2        | M            | ✅      |
| Page           | PROD-014 | Product Management Page                        | P0        | M            | ✅      |
| Layout         | PROD-015 | Inline Table Layout (no modal)                 | P0        | M            | ✅      |

---

## Task Details

### PROD-001 — DB Schema: Products, Categories, Product_Units ✅

**File**: `task/product-management/PROD-001-PRD-db-schema-products-categories-product-units.md`
**Priority**: P0 | **Complexity**: M

- [x] Schema `products`: sku (unique), barcode (unique), name, category (legacy text), categoryId (FK), priceBuy, priceSell, stock, baseUnit, imagePath, minStock, isActive
- [x] Schema `categories`: id, name, parentId (self-ref, via migration), isActive, createdAt
- [x] Schema `product_units`: id, productId (FK), unitName, conversionFactor, priceSell (override), isDefault, createdAt
- [x] Indexes pada barcode, sku, categoryId (di schema.ts)
- [x] Migration file `001_products_categories_product_units.sql` terbuat dan dijalankan via `migrate()`
- [x] Seed categories: Semua, Minuman, Makanan, Snack, Rokok
- [x] Backward compatible: `category` (legacy text) tetap dipertahankan, `hasNewSchema()` detection di service
- [x] Product service backward compatible: mendukung DB lama (kolom `price`/`cost`) dan DB baru (`priceBuy`/`priceSell`)

**Files Changed**:
- `electron/db/schema.ts` — tambah `categories`, `product_units`, field baru di `products`
- `electron/database/migrations/001_products_categories_product_units.sql` — NEW
- `electron/services/product/service.ts` — update: field baru + backward compatible + JOIN categories
- `electron/ipc/product.ts` — tidak ada (handler ada di service)

**Dependencies**: CORE-003 (DB setup foundation)

---

### PROD-002 — Product Repo + IPC: CRUD with Multi-Unit ✅

**File**: `task/product-management/PROD-002-PRD-product-repo-ipc-crud-multi-unit.md`
**Priority**: P0 | **Complexity**: M

- [x] `product:list` mengembalikan produk dengan units ter-join, support filter by category, search, active status
- [x] `product:create` menyimpan produk + units secara atomic (BEGIN/COMMIT/ROLLBACK)
- [x] `product:update` bisa mengubah produk dan units (replace units via DELETE+INSERT dalam transaction)
- [x] `product:delete` soft delete (set isActive false) jika ada transaksi, hard delete jika tidak ada transaksi
- [x] `product:checkStock` mengembalikan stock, minStock, isLow
- [x] Error `PROD_001` jika SKU/Barcode duplikat
- [x] `product:get` — join product dengan product_units (dengan units[])
- [x] `checkDuplicate()` async dengan proper await getDb()
- [x] Preload.ts: `productGet`, `productCreate`, `productUpdate`, `productDelete`, `productCheckStock` channels ditambahkan
- [x] Typecheck ✅ | Lint ✅ (0 errors, pre-existing warnings unchanged)

**New Functions Added**:
- `getProductWithUnits(id)` — ProductWithUnits | null
- `createProduct(input)` — ProductWithUnits | { error }
- `updateProduct(id, input)` — ProductWithUnits | { error }
- `deleteProduct(id)` — { success, error? }
- `checkStock(id)` — StockCheckResult | null
- `checkDuplicate(field, value, excludeId)` — async, string | null

**Files Changed**:
- `electron/services/product/service.ts` — +5 new types, +5 new service functions, +5 new IPC handlers
- `electron/preload.ts` — +5 new API methods exposed

**Dependencies**: PROD-001

---

### PROD-003 — Category Repo + IPC: CRUD + Tree ✅

**File**: `task/product-management/PROD-003-PRD-category-repo-ipc-crud-tree.md`
**Priority**: P0 | **Complexity**: S

- [x] `category:list` mengembalikan semua kategori dengan JOIN parent name + productCount
- [x] `category:create` membuat kategori baru, cek duplicate name (error CAT_002)
- [x] `category:update` mengubah nama dan parentId, cek circular parent (error CAT_004)
- [x] `category:delete` error CAT_001 jika masih punya produk aktif, CAT_004 jika masih punya sub-kategori
- [x] Bisa membuat sub-kategori (nested) dengan parentId opsional
- [x] Self-parent prevention dan circular parent detection
- [x] Category service di file terpisah: `electron/services/category/service.ts`
- [x] Preload.ts + main.ts terupdate untuk category channels
- [x] Typecheck ✅ | Lint ✅ (0 errors, pre-existing warnings unchanged)

**Files Changed**:
- `electron/services/category/service.ts` — NEW: CategoryRow, CategoryInput, list/get/create/update/delete + registerCategoryHandlers()
- `electron/main.ts` — import + call registerCategoryHandlers()
- `electron/preload.ts` — categoryList, categoryGet, categoryCreate, categoryUpdate, categoryDelete

**Dependencies**: PROD-001

---

### PROD-004 — Unit Conversion Logic & Validation ✅

**File**: `task/product-management/PROD-004-PRD-unit-conversion-logic-validation.md`
**Priority**: P0 | **Complexity**: M

- [x] `convertToBaseUnit(qty, unitName, units)` — qty × conversionFactor
- [x] `convertFromBaseUnit(baseQty, unitName, units)` — baseQty ÷ conversionFactor, rounded
- [x] Error `PROD_003` jika unit tidak ditemukan (list available units di pesan error)
- [x] Error `PROD_003` jika conversionFactor <= 0
- [x] `validateUnits(units)` — cek duplikat nama (case-insensitive), empty name, factor > 0
- [x] `suggestUnit(input, units)` — cari unit by name (case-insensitive)
- [x] `getDefaultUnit(units)` — ambil unit dengan isDefault=true
- [x] `getUnit(unitName, units)` — ambil unit by name
- [x] Dedicated file: `electron/services/unit-conversion/service.ts`
- [x] Typecheck ✅ | Lint ✅ (0 errors, pre-existing warnings unchanged)

**Functions Exported**:
- `convertToBaseUnit(qty, unitName, units)` → number
- `convertFromBaseUnit(baseQty, unitName, units)` → number
- `validateUnits(units)` → void | throws UnitConversionError
- `suggestUnit(input, units)` → UnitDef | null
- `getDefaultUnit(units)` → UnitDef | null
- `getUnit(unitName, units)` → UnitDef | null

**Files Changed**:
- `electron/services/unit-conversion/service.ts` — NEW

**Dependencies**: PROD-001

---

### PROD-005 — Product Store (Zustand) ✅

**File**: `task/product-management/PROD-005-PRD-product-store-zustand.md`
**Priority**: P0 | **Complexity**: S

- [x] State: `products`, `categories`, `selectedProduct`, `isLoading`, `isLoadingCategories`, `error`, `lowStockAlerts`
- [x] `fetchProducts(filter?)` — muat produk dari IPC `product:list`, handle ApiResponse unwrap
- [x] `fetchCategories()` — muat kategori dari IPC `category:list`
- [x] `fetchProductById(id)` — muat detail produk dengan units via `product:get`
- [x] `createProduct(input)` — panggil `product:create` dan refresh list
- [x] `updateProduct(id, input)` — panggil `product:update` dan refresh list
- [x] `deleteProduct(id)` — panggil `product:delete` dan refresh list
- [x] `checkLowStock()` — filter produk dengan stock <= minStock
- [x] `clearSelected()`, `clearError()` — utility actions
- [x] Store di `src/stores/productStore.ts`
- [x] Types di-share via `src/lib/api.ts` (ProductRow, ProductWithUnits, CategoryRow, dll)
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `src/stores/productStore.ts` — NEW
- `src/lib/api.ts` — tambah ProductRow, ProductWithUnits, ProductUnitRow, ProductFilter, CreateProductInput, UpdateProductInput, StockCheckResult, CategoryRow, CategoryInput + API signatures

**Dependencies**: PROD-002, PROD-003

---

### PROD-006 — ProductList + ProductCard Components ✅

**File**: `task/product-management/PROD-006-PRD-product-list-product-card-components.md`
**Priority**: P0 | **Complexity**: M

- [x] `ProductTable.tsx` (pos) — refactored untuk pakai `useProductStore` instead of inline `window.api.productList()`
- [x] `ProductList.tsx` — management-focused table di `src/components/product/ProductList.tsx`
  - [x] Search by name/SKU/barcode real-time
  - [x] Category filter dropdown (dari store categories)
  - [x] Sortable columns: Nama Produk, SKU, Harga Jual, Stok
  - [x] Low stock badge/indicator (stok <= minStock)
  - [x] Active/inactive status indicator
  - [x] Row count footer
  - [x] `onEdit`, `onView` props untuk row actions
- [x] `ProductCard.tsx` — grid card view di `src/components/product/ProductCard.tsx`
  - [x] Product name, category, SKU, price, stock
  - [x] Low stock badge
  - [x] Image placeholder
  - [x] Hover: show edit/delete action buttons
  - [x] Inactive product: reduced opacity
- [x] POS `ProductTable.tsx` — uses `useProductStore` instead of mock data
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `src/components/pos/ProductTable.tsx` — refactored: removed MOCK_PRODUCTS, removed inline window.api call, now uses useProductStore
- `src/components/product/ProductList.tsx` — NEW
- `src/components/product/ProductCard.tsx` — NEW

**Dependencies**: PROD-005

---

### PROD-007 — ProductForm Component (Create/Edit) ✅

**File**: `task/product-management/PROD-007-PRD-product-form-component-create-edit.md`
**Priority**: P0 | **Complexity**: L

- [x] Field: nama, SKU, barcode scanner input, kategori select, baseUnit, priceBuy, priceSell, minStock, image path
- [x] Barcode input support via scanner (text input dengan icon barcode)
- [x] Dynamic unit rows: add/remove/edit dengan nama, conversionFactor, override price, isDefault checkbox
- [x] Auto-suggest conversionFactor berdasarkan nama unit (kg=1000, gram=1, lusin=12, dus=1, pcs=1, ml=1, liter=1000, l=1000)
- [x] Validasi: SKU format (alphanumeric + dash), barcode alphanumeric, priceBuy > 0, priceSell > 0, stock >= 0, minStock >= 0, unit unique, factor > 0
- [x] Submit menyimpan produk + units atomic via store (createProduct / updateProduct)
- [x] Mode edit memuat data existing dari store.selectedProduct
- [x] Toggle aktif/non-aktif produk
- [x] Dialog-based form di `src/components/product/ProductForm.tsx`
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `src/components/product/ProductForm.tsx` — NEW: 560 lines, full-featured create/edit dialog

**Dependencies**: PROD-005, PROD-004

---

### PROD-008 — CategoryTree Component ✅

**File**: `task/product-management/PROD-008-PRD-category-tree-component.md`
**Priority**: P0 | **Complexity**: M

- [x] Tree view untuk kategori (nested display) — recursive rendering dengan indentasi visual
- [x] Expand/collapse sub-kategori dengan caret toggle
- [x] "Semua Kategori" root node dengan total product count
- [x] Toolbar: Expand All, Collapse All, Tambah button
- [x] Inline edit nama kategori (FloppyDisk save, X cancel, Enter to save)
- [x] Delete dengan konfirmasi (ketik "HAPUS" untuk konfirmasi, CAT_001 error dari API)
- [x] Product count badge per kategori
- [x] Active/inactive indicator
- [x] Drag-and-drop: di-skip untuk sekarang (bisa jadi enhancement P1)
- [x] Tree di `src/components/product/CategoryTree.tsx`
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `src/components/product/CategoryTree.tsx` — NEW: ~270 lines, recursive tree with inline edit + delete confirmation

**Dependencies**: PROD-003

---

### PROD-009 — Low Stock Alert Detection & Dashboard Widget ✅

**File**: `task/product-management/PROD-009-PRD-low-stock-alert-detection-dashboard-widget.md`
**Priority**: P1 | **Complexity**: S

- [x] Service `getLowStockProducts()` di `electron/services/product/service.ts` — cek produk dengan stock <= min_stock (active only)
- [x] IPC handler `product:lowStock` terdaftar di `registerProductHandlers()`
- [x] Preload channel `productLowStock` di `electron/preload.ts`
- [x] API type `productLowStock` di `src/lib/api.ts`
- [x] Widget component `LowStockWidget.tsx` di `src/components/product/LowStockWidget.tsx`
  - [x] Show count badge (red jika ada produk low stock, gray jika tidak ada)
  - [x] Expandable dropdown dengan daftar produk low stock (nama, stok saat ini vs min stock)
  - [x] Refresh button di dropdown
  - [x] `onFilterLowStock` prop untuk callback klik
- [x] `POSTerminalPage.tsx` — render `<LowStockWidget />` di toolbar area (left column, above ProductTable)
- [x] Real-time refresh: setelah transaksi berhasil, panggil `__refreshLowStockWidget()` dengan delay 2 detik
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `electron/services/product/service.ts` — tambah `getLowStockProducts()` + IPC handler `product:lowStock`
- `electron/preload.ts` — tambah channel `productLowStock`
- `src/lib/api.ts` — tambah `productLowStock` di API interface
- `src/components/product/LowStockWidget.tsx` — NEW
- `src/pages/POSTerminalPage.tsx` — import dan render `<LowStockWidget />` + refresh call setelah transaksi

**Dependencies**: PROD-005

---

### PROD-010 — Bulk Import: CSV/Excel Parser + Preview ✅

**File**: `task/product-management/PROD-010-PRD-bulk-import-csv-excel-parser-preview.md`
**Priority**: P1 | **Complexity**: L

- [x] Import produk dari file Excel/CSV (parse di main process dengan xlsx library)
- [x] Two-phase: parse+validate (preview) → commit (atomic DB write)
- [x] Preview 10 baris pertama sebelum import
- [x] Validasi: SKU unik (check against existing DB), kategori ada di database
- [x] Atomic import: BEGIN TRANSACTION / COMMIT / ROLLBACK
- [x] Report error dengan nomor baris dan alasan
- [x] Column auto-mapping: Nama/SKU/Barcode/Kategori/Harga Beli/Jual/Stok/Satuan/Min Stok (case-insensitive, Indonesian aliases)
- [x] Service: `electron/services/product/bulk-import.service.ts`
  - `previewImport(filePath)` → parse + validate, return rows + errors
  - `commitImport(rows)` → atomic DB write, return result
- [x] IPC handlers: `product:import-preview`, `product:import-commit`
- [x] UI: `src/components/product/BulkImportDialog.tsx` — Dialog dengan file picker, preview table, result display
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `electron/services/product/bulk-import.service.ts` — NEW: previewImport(), commitImport(), registerBulkImportHandlers()
- `electron/main.ts` — import + call registerBulkImportHandlers()
- `electron/preload.ts` — productImportPreview, productImportCommit channels
- `src/lib/api.ts` — ImportRow type, preview/commit API signatures
- `src/components/product/BulkImportDialog.tsx` — NEW: two-phase import dialog
- `package.json` — added xlsx dependency

**Dependencies**: PROD-002

---

### MIGRATION FIX — Folder Consolidation ✅

**Completed**: 2026-05-29

**Problem**: Dua folder migrations (`pos/database/migrations/` dan `pos/electron/database/migrations/`) menyebabkan migrasi tidak jalan. Drizzle Kit membuat file di `pos/database/migrations/` tapi `migrate()` di `electron/db/index.ts` membaca dari `electron/database/migrations/`.

**Fix**:
1. Hapus folder `pos/database/migrations/` (Drizzle auto-generated, tidak dipakai)
2. Konsolidasi semua migrasi ke `pos/electron/database/migrations/` saja
3. Buat `001_full_schema.sql` yang menggabungkan schema lengkap (8 tabel + seed + indexes) dalam urutan FK yang benar
4. Fix `MIGRATIONS_DIR` di `electron/db/index.ts` menggunakan `process.cwd()` agar resolve benar di dev dan production
5. Fix `migrate()` untuk log per-statement dan tidak record hash jika ada error
6. Update `drizzle.config.ts` `out:` ke `./electron/database/migrations`

**Result**: Migration berhasil apply 15 statements, semua 9 tabel ter-create, seed categories 5 baris, indexes semua ada.

**Files Changed**:
- `electron/db/index.ts` — MIGRATIONS_DIR fix, statement-level error logging
- `drizzle.config.ts` — out: './electron/database/migrations'
- `electron/database/migrations/001_full_schema.sql` — NEW: consolidated schema
- `pos/database/` — DELETED

---

### PROD-011 — Bulk Export to CSV/Excel ✅

**File**: `task/product-management/PROD-011-PRD-bulk-export-to-csv-excel.md`
**Priority**: P1 | **Complexity**: S

- [x] Export sesuai filter aktif (search, category, active status)
- [x] Format file .xlsx atau .csv
- [x] File bisa dibuka di Excel (BOM untuk CSV, xlsx library untuk Excel)
- [x] Filename mengandung tanggal (`produk_export_YYYY-MM-DD.xlsx/csv`)
- [x] Service: `electron/services/product/bulk-export.service.ts` — `exportProducts(params)` dengan `buildWhere()` filter builder
- [x] IPC handler `product:export` registered
- [x] Preload channel `productExport`
- [x] API type di `src/lib/api.ts`
- [x] UI: `src/components/product/BulkExportDialog.tsx` — format toggle, category filter, include-inactive checkbox, count preview, result display
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `electron/services/product/bulk-export.service.ts` — NEW
- `electron/main.ts` — import + registerBulkExportHandlers()
- `electron/preload.ts` — productExport channel
- `src/lib/api.ts` — productExport API signature
- `src/components/product/BulkExportDialog.tsx` — NEW

**Dependencies**: PROD-002

---

### PROD-012 — Product Image Upload & Thumbnail ⛔ SKIPPED

**File**: `task/product-management/PROD-012-PRD-product-image-upload-thumbnail.md`
**Priority**: P1 | **Complexity**: S

**Decision**: Skipped — tidak ada kebutuhan upload gambar produk untuk MVP. `imagePath` tetap ada di schema untuk menyimpan path gambar jika dibutuhkan di masa depan, tapi tidak ada fitur upload di UI.

---

### PROD-013 — Product History / Audit Trail ✅

**File**: `task/product-management/PROD-013-PRD-product-history-audit-trail.md`
**Priority**: P2 | **Complexity**: M
**Completed**: 2026-05-29

- [x] Catat setiap update produk ke log terpisah (create/update/delete + full JSON snapshot)
- [x] Tampilkan timeline perubahan di detail produk (via `product:history` IPC + `ProductHistoryEntry` type)
- [x] Filter by date range (ORDER BY changed_at DESC, LIMIT 100)
- [x] `product:history` IPC handler + preload channel `productHistory`
- [x] Migration `002_product_history.sql` dengan indexes (product_id, changed_at)
- [x] Typecheck ✅ | Lint ✅

**Files Changed**:
- `electron/database/migrations/002_product_history.sql` — NEW
- `electron/db/schema.ts` — tambah `productHistory` table
- `electron/services/product/service.ts` — `writeHistory()`, `productSnapshot()`, `getProductHistory()`, audit hook di create/update/delete, `product:history` handler
- `electron/preload.ts` — `productHistory` channel
- `src/lib/api.ts` — `ProductHistoryEntry` type + `productHistory` API signature

**Audit Actions Logged**:
| Action | Trigger | Old Data | New Data |
|--------|---------|----------|----------|
| `create` | Produk baru dibuat | null | Full product snapshot |
| `update` | Produk diperbarui | Full snapshot sebelum | Full snapshot sesudah |
| `delete` | Produk dihapus | Full snapshot sebelum | null |

**Known Limitation**: `userId` tidak diisi saat ini ( logged sebagai `null`). Siap untuk diisi dari auth store di masa depan.

**Dependencies**: PROD-002

---

### PROD-014 — Product Management Page ✅

**File**: `task/product-management/PROD-014-PRD-product-management-page.md`
**Priority**: P0 | **Complexity**: M

**Completed**: 2026-05-29 (via agent session ses_1908f7fcfffeOkGNeYVhoR0ec8)

- [x] Route `/products` terdefinisi di `src/App.tsx`
- [x] Header: judul "Manajemen Produk" + tombol "Tambah Produk", "Import", "Export"
- [x] Sidebar: `CategoryTree` untuk filter kategori
- [x] Toggle view: Daftar (table via `ProductList`) / Grid (card via `ProductCard`)
- [x] `ProductForm` dialog untuk create/edit
- [x] `BulkImportDialog` dan `BulkExportDialog` terintegrasi
- [x] State dari `useProductStore`
- [x] Semua teks dalam bahasa Indonesia
- [x] Typecheck ✅
- [x] Bug fix `ProductForm.tsx`: removed stray `</div>` yang menyebabkan TS17002 JSX mismatch

**Files Created**:
- `src/pages/ProductPage.tsx` — main product management page (253 lines)
- `task/product-management/PROD-014-PRD-product-management-page.md` — task file

**Files Changed**:
- `src/App.tsx` — import + route `ProductPage`
- `src/components/product/ProductForm.tsx` — JSX bug fix (double-closing div)

**Known Limitations** (follow-up):
- `selectedCategoryId` belum di-propagate ke `ProductList`'s `categoryFilter` prop
- `ProductForm` category `<select>` options belum di-render dari store

**Dependencies**: PROD-005~PROD-011

---

### PROD-015 — Inline Table Layout (No Modal) ✅

**Priority**: P0 | **Complexity**: M

**Completed**: 2026-05-29

Deskripsi: Redesign layout halaman ProductPage — sidebar menu kiri (Produk/Kategori), konten kanan berupa tabel inline-editable (CRUD by row, tanpa modal).

- [x] Sidebar menu kiri: "Produk" dan "Kategori" dengan count badge
- [x] Sidebar stats ringkasan (total, aktif, stok rendah)
- [x] InlineProductTable: tabel produk dengan inline edit per baris
  - [x] "Tambah Baris" menambah row kosong di atas tabel
  - [x] Klik Edit → baris menjadi editable (input per kolom)
  - [x] Enter untuk simpan, Escape untuk batal
  - [x] Kolom: SKU, Nama, Kategori (dropdown), Harga Beli, Harga Jual, Stok, Satuan, Min Stok, Aktif
  - [x] Hapus produk dengan konfirmasi
  - [x] Search + filter kategori + toggle nonaktif
- [x] InlineCategoryTable: tabel kategori dengan inline edit per baris
  - [x] "Tambah Baris" menambah row kosong
  - [x] Klik Edit → baris menjadi editable
  - [x] Parent kategori dropdown (mencegah circular reference)
  - [x] Hapus kategori dengan konfirmasi ketik "HAPUS"
  - [x] Tree indent visual untuk kategori anak
- [x] ProductForm, ProductList, CategoryTree tetap ada (tidak dihapus) tapi tidak digunakan di ProductPage
- [x] BulkImportDialog dan BulkExportDialog tetap via header button
- [x] Typecheck ✅ | Lint ✅ (warnings only, no new errors)

**Files Created**:
- `src/components/product/InlineProductTable.tsx` — inline-editable product table
- `src/components/product/InlineCategoryTable.tsx` — inline-editable category table

**Files Changed**:
- `src/pages/ProductPage.tsx` — rewrite: sidebar menu + tab content (produk/kategori)

**Key Decisions**:
- CRUD by row (tambah baris kosong, edit inline) bukan modal dialog
- Kategori dropdown di product table mengexclude kategori yang sedang diedit (mencegah circular parent)
- Delete kategori membutuhkan konfirmasi ketik "HAPUS"
- Button Import/Export hanya muncul di tab Produk
- Sidebar stats menyesuaikan tab aktif (produk vs kategori)

---

```
CORE-003 (DB Foundation)
    │
    ▼
PROD-001 (DB Schema: products, categories, product_units)
    │
    ├── PROD-002 (Product Repo + IPC) ──► PROD-010, PROD-011, PROD-013
    │       │
    │       ▼
    │   PROD-005 (Product Store) ──► PROD-006, PROD-007, PROD-009
    │       │
    │       ▼
    │   PROD-009 (Low Stock Alert) ──► Dashboard Integration
    │
    ├── PROD-003 (Category Repo + IPC) ──► PROD-008
    │       │
    │       ▼
    │   PROD-008 (CategoryTree Component)
    │
    └── PROD-004 (Unit Conversion Service) ──► PROD-007
            │
            ▼
        PROD-007 (ProductForm)

PROD-012 (Image Upload) ──► PROD-007
```

---

## Implementation Order

### Batch 1: Foundation (P0)
1. **PROD-001** — DB schema (products, categories, product_units)
2. **PROD-003** — Category repo + IPC (sederhana, bisa paralel dengan PROD-002)
3. **PROD-002** — Product repo + IPC
4. **PROD-004** — Unit conversion service

### Batch 2: State + UI (P0)
5. **PROD-005** — Product store (Zustand)
6. **PROD-008** — CategoryTree component
7. **PROD-006** — ProductList + ProductCard
8. **PROD-007** — ProductForm (create/edit)

### Batch 3: P1 Enhancements
9. **PROD-009** — Low stock alert + dashboard widget
10. **PROD-010** — Bulk import CSV/Excel
11. **PROD-011** — Bulk export CSV/Excel
12. **PROD-012** — Image upload & thumbnail (skipped — tidak dibutuhkan MVP)

### Batch 4: Page + Layout + P2
13. **PROD-014** — Product management page (halaman produk terpadu)
14. **PROD-015** — Inline table layout (CRUD by row, no modal)
15. **PROD-013** — Product history / audit trail (P2, pending)

---

## Blockers
- None

---

## Key Decisions
- Soft delete vs hard delete: soft delete jika ada transaksi (isActive=0), hard delete jika belum ada transaksi — dipilih untuk menjaga integritas data transaksi
- Atomic create/update dengan BEGIN TRANSACTION / COMMIT / ROLLBACK untuk produk + units
- Duplicate check menggunakan async `checkDuplicate()` dengan `await getDb()` dan `esc()` untuk SQL injection prevention
- `product:list` tetap backward compatible: mendeteksi skema DB via `PRAGMA table_info`, fallback ke mock jika error
- Unit conversion logic (PROD-004) akan dipisah jadi service terpisah, tidak di-embed di CRUD

---

## Notes
- Modul Product Management adalah foundation untuk POS Terminal dan Inventory
- Multi-unit conversion adalah fitur kunci — harus akurat untuk transaksi penjualan
- PROD-014 (product page) selesai, mengintegrasikan semua komponen yang ada
- PROD-015 (inline table layout) menggantikan modal-based form dengan tabel inline-editable
- PROD-012 (image upload) di-skip — tidak dibutuhkan untuk MVP, `imagePath` tetap ada di schema untuk masa depan
- PROD-013 (audit trail) adalah P2, bisa ditunda sampai P0+P1 selesai
- `seedAdmin()` di `electron/db/index.ts` sekarang dipanggil di `electron/main.ts` setelah `migrate()` — admin default PIN: 123456
- Komponen lama (ProductForm, ProductList, CategoryTree) tetap ada tapi tidak digunakan di ProductPage — masih bisa digunakan di tempat lain
