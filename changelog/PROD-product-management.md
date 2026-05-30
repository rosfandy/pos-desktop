# Changelog: Product Management Module

**Last Updated**: 2026-05-28
**Status**: 🟢 PROD-001~PROD-010 complete (10/13)

---

## Overview

Modul Product Management: 10/13 task selesai (PROD-001~PROD-010). Sisa 3 task: PROD-011~PROD-013.

| Kode | Deskripsi | Prioritas |
|------|-----------|-----------|
| PROD-001 | DB Schema: products, categories, product_units | P0 | ✅ Done |
| PROD-002 | Product Repo + IPC: CRUD with Multi-Unit | P0 | ✅ Done |
| PROD-003 | Category Repo + IPC: CRUD + Tree | P0 | ✅ Done |
| PROD-004 | Unit Conversion Logic & Validation | P0 | ✅ Done |
| PROD-005 | Product Store (Zustand) | P0 | ✅ Done |
| PROD-006 | ProductList + ProductCard Components | P0 | ✅ Done |
| PROD-007 | ProductForm Component (Create/Edit) | P0 | ✅ Done |
| PROD-008 | CategoryTree Component | P0 | ✅ Done |
| PROD-009 | Low Stock Alert Detection & Dashboard Widget | P1 | ✅ Done |
| PROD-010 | Bulk Import: CSV/Excel Parser + Preview | P1 | ✅ Done |
| PROD-011 | Bulk Export to CSV/Excel | P1 |
| PROD-012 | Product Image Upload & Thumbnail | P1 |
| PROD-013 | Product History / Audit Trail | P2 |

---

## PROD-001 — DB Schema: Products, Categories, Product_Units ✅

**Completed**: 2026-05-28

### Changes Made

**`electron/db/schema.ts`**:
- `categories` table: id, name, parentId (self-ref via migration), isActive, createdAt
- `products` table: id, name, sku (unique), barcode (unique), category (legacy text), **categoryId** (FK → categories), priceBuy, priceSell, stock, baseUnit, imagePath, minStock, isActive, createdAt, updatedAt
- `product_units` table: id, productId (FK), unitName, conversionFactor, priceSell (override), isDefault, createdAt
- Indexes on barcode, sku, categoryId

**`electron/database/migrations/001_products_categories_product_units.sql`** — NEW:
- Creates `categories` table dengan seed data (Semua, Minuman, Makanan, Snack, Rokok)
- Creates `product_units` table dengan unique constraint (productId, unitName)
- Adds `sku`, `min_stock`, `category_id` columns ke `products` (menggunakan `ALTER TABLE ADD COLUMN`)
- Kolom-kolom ini ditambahkan hanya jika belum ada (migration hanya dijalankan sekali)

**`electron/services/product/service.ts`** — FULL REWRITE:
- Backward compatible dengan DB lama (kolom `price`, `cost`, `unit`, `unit_conversion`)
- `hasNewSchema()` detection: cek apakah kolom `sku`, `min_stock`, `category_id` ada di tabel products
- Query SELECT skema baru: JOIN `products` + `categories` untuk dapat `categoryName`
- Query SELECT skema lama: SELECT dari `products` tanpa JOIN (category sebagai text)
- `listProducts()`, `getProductByBarcode()`, `getProductById()` — semua mendukung kedua skema
- `updateProductStock()` — sama untuk kedua skema
- Mock fallback data: 24 produk dengan semua field baru

### Backward Compatibility

| Field | Legacy (old DB) | New (after migration) |
|-------|-----------------|-----------------------|
| Price jual | `price` (integer) | `price_sell` (integer) |
| Price beli | `cost` (integer) | `price_buy` (integer) |
| Unit | `unit` (text) | `base_unit` (text) |
| Konversi | `unit_conversion` (int) | `product_units` table (relasi) |
| Kategori | `category` (text, bebas) | `category_id` (FK → categories) |
| SKU | ❌ tidak ada | ✅ `sku` (unique, nullable) |
| Min stok | ❌ tidak ada | ✅ `min_stock` (integer) |

Service otomatis detect skema dan mapping ke `ProductRow` yang seragam:
- `priceBuy` = `cost` (legacy) atau `price_buy` (new)
- `priceSell` = `price` (legacy) atau `price_sell` (new)
- `categoryId` = `null` (legacy) atau `category_id` (new)
- `minStock` = `0` (legacy) atau `min_stock` (new)

### IPC Channels (unchanged)

```
product:list         →  list products with filters (categoryId, search, isActive)
product:getByBarcode →  get single product by barcode
product:getById      →  get single product by id
product:updateStock  →  update stock (+/- quantity)
```

---

## Architecture Plan

### Database Schema (PROD-001)

**`products` table**:
```
id              TEXT PRIMARY KEY
sku             TEXT UNIQUE
barcode         TEXT UNIQUE
name            TEXT NOT NULL
categoryId      TEXT REFERENCES categories(id)
priceBuy        REAL NOT NULL
priceSell       REAL NOT NULL
stock           REAL NOT NULL DEFAULT 0
baseUnit        TEXT NOT NULL DEFAULT 'pcs'
imagePath       TEXT
minStock        REAL NOT NULL DEFAULT 0
isActive        INTEGER NOT NULL DEFAULT 1
createdAt       INTEGER NOT NULL
updatedAt       INTEGER NOT NULL
```

**`categories` table** (self-referential untuk nested category):
```
id              TEXT PRIMARY KEY
name            TEXT NOT NULL
parentId        TEXT REFERENCES categories(id)
isActive        INTEGER NOT NULL DEFAULT 1
createdAt       INTEGER NOT NULL
```

**`product_units` table** (multi-unit support):
```
id              TEXT PRIMARY KEY
productId       TEXT NOT NULL REFERENCES products(id)
unitName        TEXT NOT NULL         -- 'pcs', 'lusin', 'kg', '1/2 kg', dll
conversionFactor REAL NOT NULL        -- 1 untuk base unit, 12 untuk lusin, 1000 untuk kg
priceSell       REAL                  -- override harga jual per unit (null = pakai priceSell produk)
isDefault       INTEGER NOT NULL DEFAULT 0
createdAt       INTEGER NOT NULL
-- Unique constraint: (productId, unitName)
```

### IPC Channels (PROD-002, PROD-003)

```
// Products
product:list       →  list products with filters (category, search, active)
product:get        →  get single product with units
product:create     →  create product + units (atomic)
product:update     →  update product + units (atomic)
product:delete     →  soft/hard delete
product:checkStock  →  get stock info (stock, minStock, isLow)

// Categories
category:list      →  list all categories (flat with parent-child)
category:create    →  create category
category:update    →  update category (name, parentId)
category:delete    →  delete category (error CAT_001 if has products)
```

### Unit Conversion Logic (PROD-004)

```
convertToBaseUnit(quantity, unitName, units)
  → quantity * conversionFactor

convertFromBaseUnit(baseQuantity, unitName, units)
  → baseQuantity / conversionFactor

Contoh:
  baseUnit = 'gram'
  units = [
    { unitName: 'pcs', conversionFactor: 1 },
    { unitName: 'kg', conversionFactor: 1000 },
    { unitName: '1/2 kg', conversionFactor: 500 },
  ]
  convertToBaseUnit(2, 'kg', units) = 2 * 1000 = 2000 gram
  convertFromBaseUnit(250, '1/2 kg', units) = 250 / 500 = 0.5 (setengah 1/2 kg)
```

### Category Tree (PROD-003, PROD-008)

```
Kategori
  ├── Makanan
  │     ├── Minuman
  │     └── Snack
  └── Non-Makanan
        └── Alat
```

Flat list di database dengan `parentId`, component CategoryTree merender nested structure.

---

## Implementation Order

### Batch 1: Foundation (P0)
1. **PROD-001** — DB schema (products, categories, product_units)
2. **PROD-003** — Category repo + IPC (sederhana, bisa paralel)
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
12. **PROD-012** — Image upload & thumbnail

### Batch 4: P2 Nice-to-Have
13. **PROD-013** — Product history / audit trail

---

## Notes

- Modul ini adalah fondasi untuk POS Terminal dan Inventory
- Multi-unit conversion adalah fitur kunci — harus akurat untuk transaksi penjualan
- PROD-010 (bulk import) dengan kompleksitas L — membutuhkan testing ekstensif
- PROD-012 (image upload) membutuhkan integrasi dengan main process (dialog file picker)
- PROD-013 (audit trail) adalah P2, bisa ditunda sampai P0+P1 selesai

---

## PROD-002 — Product Repo + IPC: CRUD with Multi-Unit ✅

**Completed**: 2026-05-28

### New Functions in `electron/services/product/service.ts`

| Function | Channel | Description |
|----------|---------|-------------|
| `listProducts(filter?)` | `product:list` | List products with category join, filter by category/search/active |
| `getProductByBarcode(barcode)` | `product:getByBarcode` | Find product by barcode |
| `getProductById(id)` | `product:getById` | Find product by ID |
| `getProductWithUnits(id)` | `product:get` | Product + units joined |
| `createProduct(input)` | `product:create` | Atomic create product + units (BEGIN/COMMIT/ROLLBACK) |
| `updateProduct(id, input)` | `product:update` | Update product + replace units atomically |
| `deleteProduct(id)` | `product:delete` | Soft delete if has transactions, hard delete if none |
| `checkStock(id)` | `product:checkStock` | Returns { stock, minStock, isLow } |

### New Types
- `ProductWithUnits` — ProductRow + `units: ProductUnitRow[]`
- `ProductUnitRow` — id, productId, unitName, conversionFactor, priceSell, isDefault
- `CreateProductInput`, `UpdateProductInput`, `StockCheckResult`

### Error Handling
- `PROD_001`: SKU/Barcode duplicate check in create/update
- Duplicate check: `checkDuplicate()` async with `esc()` SQL injection prevention

### Preload + Main
- `electron/preload.ts`: +5 new channels (productGet, productCreate, productUpdate, productDelete, productCheckStock)
- `electron/main.ts`: no change needed (registerProductHandlers covers all)

---

## PROD-003 — Category Repo + IPC: CRUD + Tree ✅

**Completed**: 2026-05-28

### New File: `electron/services/category/service.ts`

| Function | Channel | Description |
|----------|---------|-------------|
| `listCategories()` | `category:list` | All categories with parentName + productCount |
| `getCategoryById(id)` | `category:get` | Single category |
| `createCategory(input)` | `category:create` | Create new category, check duplicate name (CAT_002) |
| `updateCategory(id, input)` | `category:update` | Update name/parent, prevent self-parent & circular parent (CAT_004) |
| `deleteCategory(id)` | `category:delete` | Delete with CAT_001 (has products) + CAT_004 (has children) guard |

### Error Codes
- `CAT_001`: Kategori masih memiliki produk aktif
- `CAT_002`: Nama kategori sudah ada
- `CAT_003`: Kategori tidak ditemukan
- `CAT_004`: Hubungan parent melingkar / masih punya sub-kategori

### Preload + Main
- `electron/preload.ts`: +5 new channels (categoryList, categoryGet, categoryCreate, categoryUpdate, categoryDelete)
- `electron/main.ts`: added `registerCategoryHandlers()`

---

## PROD-004 — Unit Conversion Logic & Validation ✅

**Completed**: 2026-05-28

### New File: `electron/services/unit-conversion/service.ts`

| Function | Description |
|----------|-------------|
| `convertToBaseUnit(qty, unitName, units)` | qty × conversionFactor |
| `convertFromBaseUnit(baseQty, unitName, units)` | baseQty ÷ conversionFactor, rounded to 3 decimals |
| `validateUnits(units)` | Checks: no duplicate names, no empty names, all factors > 0 |
| `suggestUnit(input, units)` | Find unit by name (case-insensitive) |
| `getDefaultUnit(units)` | Get unit with isDefault=true |
| `getUnit(unitName, units)` | Get unit by name |

### Auto-suggest mapping
`kg`→1000, `gram`/`g`→1, `lusin`/`lsn`→12, `dus`/`box`/`botol`→1, `pcs`/`piece`→1, `ml`→1, `liter`/`l`→1000

### Error
- `UnitConversionError` (PROD_003): unit not found, factor <= 0, empty list, duplicate names

---

## PROD-005 — Product Store (Zustand) ✅

**Completed**: 2026-05-28

### New File: `src/stores/productStore.ts`

State: `products`, `categories`, `selectedProduct`, `isLoading`, `isLoadingCategories`, `error`, `lowStockAlerts`

Actions:
- `fetchProducts(filter?)` — calls `product:list`, unwraps ApiResponse
- `fetchCategories()` — calls `category:list`
- `fetchProductById(id)` — calls `product:get`
- `createProduct(input)` — calls `product:create`, refreshes list
- `updateProduct(id, input)` — calls `product:update`, refreshes list
- `deleteProduct(id)` — calls `product:delete`, refreshes list
- `checkLowStock()` — filter stock <= minStock
- `clearSelected()`, `clearError()`

### Types shared via `src/lib/api.ts`
`ProductRow`, `ProductWithUnits`, `ProductUnitRow`, `ProductFilter`, `CreateProductInput`, `UpdateProductInput`, `StockCheckResult`, `CategoryRow`, `CategoryInput`, `API` interface expanded with all product/category channels.

---

## PROD-006 — ProductList + ProductCard Components ✅

**Completed**: 2026-05-28

### Modified: `src/components/pos/ProductTable.tsx`
- Removed `MOCK_PRODUCTS` hardcoded data
- Removed inline `window.api.productList()` call
- Now uses `useProductStore` for data (products loaded from store)
- Map store `ProductRow` → POS `Product` shape (priceSell/100 → rupiah)

### New: `src/components/product/ProductList.tsx`
- Management-focused table with sortable columns (Nama, SKU, Harga Jual, Stok)
- Search by name/SKU/barcode real-time
- Category filter dropdown
- Low stock indicator (stok <= minStock)
- Active/inactive status column
- Edit/View action buttons per row
- Row count footer

### New: `src/components/product/ProductCard.tsx`
- Grid card: image placeholder, name, category, SKU, price, stock
- Low stock badge (red)
- Inactive product: reduced opacity
- Hover: show edit/delete action buttons

---

## PROD-007 — ProductForm Component (Create/Edit) ✅

**Completed**: 2026-05-28

### New File: `src/components/product/ProductForm.tsx` (~560 lines)

Dialog-based form supporting create and edit mode:

**Fields**:
- Nama Produk (required)
- SKU (alphanumeric + dash validation)
- Barcode (alphanumeric, scanner-ready)
- Kategori (dropdown)
- Satuan Dasar (text input)
- Harga Beli / Harga Jual (number, cents → rupiah)
- Stok Awal / Min. Stok (number)
- Path Gambar (opsional)
- Aktif/nonaktif toggle

**Dynamic Unit Rows**:
- Add/remove unit rows
- Unit name with auto-suggest conversionFactor on blur (kg→1000, lusin→12, etc.)
- Override price per unit (optional)
- isDefault checkbox
- Validation: no duplicate names, factor > 0

**Validation** (touched-based):
- Name required, SKU/barcode format check, price > 0, stock >= 0

**Save**: Calls `createProduct` (new) or `updateProduct` (edit) atomically via store.

---

## PROD-008 — CategoryTree Component ✅

**Completed**: 2026-05-28

### New File: `src/components/product/CategoryTree.tsx` (~280 lines)

Recursive tree view for category hierarchy:

**Features**:
- Recursive rendering with visual indentation per depth level
- Expand/collapse sub-kategories (caret toggle)
- "Semua Kategori" root node with total product count
- Toolbar: Expand All, Collapse All, Tambah button
- Inline edit: click Pencil, edit name, Enter/FloppyDisk to save, X to cancel
- Delete with type-to-confirm ("HAPUS" text must be typed)
- Product count badge per category
- Active/inactive indicator (grayed for inactive)
- Folder/FolderOpen icons for nodes with children
- Drag-and-drop: deferred (can be P1 enhancement)

### API calls
- `window.api.categoryUpdate(id, { name })` for inline edit
- `window.api.categoryDelete(id)` for delete with CAT_001 error handling

---

## PROD-009 — Low Stock Alert Detection & Dashboard Widget ✅

**Completed**: 2026-05-28

### New Service: `electron/services/product/service.ts`

| Function | Channel | Description |
|----------|---------|-------------|
| `getLowStockProducts()` | `product:lowStock` | Returns all active products where stock <= min_stock |

### New Component: `src/components/product/LowStockWidget.tsx`

- Trigger button: shows count badge (red if low stock, gray if none)
- Expandable dropdown: list of low-stock products with current vs min stock
- Refresh button in dropdown
- `__refreshLowStockWidget()` global function for external callers (e.g., after POS transaction)

### Dashboard Integration: `src/App.tsx`

- `DashboardPage` now uses `useDashboardStore` for live stats
- `useDashboardStore` (`src/stores/dashboardStore.ts`): fetches products + low-stock + categories
- "Stok Menipis" stat card shows live count, color changes red when > 0
- "Peringatan Stok" panel: shows up to 5 low-stock products, clickable to navigate to products page
- `POSTerminalPage`: `<LowStockWidget />` rendered in left column, refreshes 2s after transaction

### New Store: `src/stores/dashboardStore.ts`

State: `lowStockCount`, `lowStockProducts`, `todaySales`, `todayTransactions`, `totalProducts`, `totalCategories`
Actions: `fetchDashboardData()`, `fetchLowStock()`

---

## PROD-010 — Bulk Import: CSV/Excel Parser + Preview ✅

**Completed**: 2026-05-28

### New Service: `electron/services/product/bulk-import.service.ts`

Two-phase import design:

| Function | Channel | Description |
|----------|---------|-------------|
| `previewImport(filePath)` | `product:import-preview` | Parse xlsx/CSV, validate rows, return preview + errors (no DB write) |
| `commitImport(rows)` | `product:import-commit` | Atomic DB write of validated rows (BEGIN/COMMIT/ROLLBACK) |

**Column auto-mapping** (case-insensitive, Indonesian aliases):
Nama → name, SKU → sku, Barcode → barcode, Kategori → categoryId, Harga Beli → priceBuy, Harga Jual → priceSell, Stok → stock, Satuan → baseUnit, Min Stok → minStock

**Validation**: name required, priceSell > 0, stock >= 0, SKU unique, barcode unique, categoryId must exist

### New Component: `src/components/product/BulkImportDialog.tsx`

- File picker (accepts .csv, .xlsx, .xls)
- Phase 1 — Preview: shows first 10 rows in table, total count
- Phase 2 — Commit: atomic import with progress feedback
- Result display: success banner with count, or error list with row numbers
- `xlsx` library for Excel/CSV parsing in main process

### Dependencies
- `xlsx` added to `package.json` (devDependency)


