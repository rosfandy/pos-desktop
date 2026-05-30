# Technical Spec: Product Management

## 1. Overview

Module untuk manajemen produk, kategori, dan multi-satuan. Fitur utama: CRUD produk, konversi satuan (pcs, lusin, kg, 1/2kg, 1/4kg, gram, liter), bulk import/export.

**Linked PRD Sections**: 5.2, 7.5 (products, categories, product_units), Appendix C

---

## 2. Architecture

```
electron/
├── ipc/
│   └── product.ts              # Product IPC handlers
├── services/
│   └── product/
│       ├── repo.ts             # Product & unit repository
│       └── service.ts          # Business logic (stock calculation)
└── db/
    └── schema.ts               # products, categories, product_units tables

src/
├── components/
│   └── product/
│       ├── ProductList.tsx
│       ├── ProductForm.tsx
│       ├── ProductCard.tsx
│       ├── UnitConverter.tsx
│       ├── CategoryTree.tsx
│       └── BulkImport.tsx
├── pages/
│   └── ProductsPage.tsx
├── stores/
│   └── productStore.ts
└── hooks/
    └── useUnitConversion.ts
```

---

## 3. Data Models

### Products Table

```typescript
// electron/db/schema.ts
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  sku: text('sku').unique(),
  barcode: text('barcode').unique(),
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  priceBuy: integer('price_buy').notNull().default(0),     // in cents
  priceSell: integer('price_sell').notNull().default(0),    // in cents (base price)
  stock: integer('stock').notNull().default(0),             // stock in base unit
  baseUnit: text('base_unit').notNull().default('pcs'),     // e.g., 'gram', 'pcs', 'ml'
  imagePath: text('image_path'),
  minStock: integer('min_stock').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

### Product Units Table (Multi-Unit Support)

```typescript
export const productUnits = sqliteTable('product_units', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id).notNull(),
  unitName: text('unit_name').notNull(),                    // e.g., 'kg', '1/2 kg', 'lusin'
  conversionFactor: integer('conversion_factor').notNull(),  // to base unit (e.g., 1000 for kg->gram)
  priceSell: integer('price_sell'),                          // optional override price
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
});
```

### Categories Table

```typescript
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  parentId: text('parent_id').references(() => categories.id),
});
```

---

## 4. API / IPC Contract

```typescript
interface ProductAPI {
  // Products
  'product:list': (filters?: { categoryId?: string; search?: string; active?: boolean }) => Promise<ProductWithUnits[]>;
  'product:get': (id: string) => Promise<ProductWithUnits | null>;
  'product:create': (data: CreateProductDTO) => Promise<Product>;
  'product:update': (id: string, data: UpdateProductDTO) => Promise<Product>;
  'product:delete': (id: string) => Promise<void>;
  'product:checkStock': (id: string) => Promise<{ stock: number; minStock: number; isLow: boolean }>;
  
  // Categories
  'category:list': () => Promise<Category[]>;
  'category:create': (data: CreateCategoryDTO) => Promise<Category>;
  'category:update': (id: string, data: UpdateCategoryDTO) => Promise<Category>;
  'category:delete': (id: string) => Promise<void>;
  
  // Import/Export
  'product:import': (filePath: string) => Promise<{ imported: number; errors: string[] }>;
  'product:export': (filters?: ProductFilter) => Promise<string>; // returns file path
}
```

---

## 5. Unit Conversion Logic

```typescript
// electron/services/product/service.ts

interface UnitConversion {
  fromUnit: string;
  toUnit: string;
  quantity: number;
}

export function convertToBaseUnit(
  productId: string, 
  quantity: number, 
  unitName: string,
  units: ProductUnit[]
): number {
  const unit = units.find(u => u.unitName === unitName);
  if (!unit) throw new Error(`Unit ${unitName} not found`);
  return quantity * unit.conversionFactor;
}

export function convertFromBaseUnit(
  baseQuantity: number,
  unitName: string,
  units: ProductUnit[]
): number {
  const unit = units.find(u => u.unitName === unitName);
  if (!unit) throw new Error(`Unit ${unitName} not found`);
  return baseQuantity / unit.conversionFactor;
}

// Example: Selling 1/2 kg of sugar
// baseUnit = 'gram', conversionFactor = 500
// convertToBaseUnit('sugar-001', 1, '1/2 kg', units) => 500 (grams)
```

---

## 6. State Management

```typescript
// src/stores/productStore.ts
interface ProductState {
  products: ProductWithUnits[];
  categories: Category[];
  selectedProduct: ProductWithUnits | null;
  loading: boolean;
  lowStockAlerts: Product[];
  
  fetchProducts: (filters?: ProductFilter) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createProduct: (data: CreateProductDTO) => Promise<void>;
  updateProduct: (id: string, data: UpdateProductDTO) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  checkLowStock: () => Promise<void>;
}
```

---

## 7. Component Details

### ProductForm.tsx
- Fields: name, SKU, barcode, category, baseUnit, priceBuy, priceSell, minStock, image
- Dynamic unit rows: add/remove units with conversionFactor
- Auto-calculate: suggest conversionFactor based on unit name (e.g., "kg" -> 1000)
- Barcode scanner input support

### UnitConverter.tsx
- Display all units for a product
- Show conversion to base unit
- Price per unit comparison

### BulkImport.tsx
- Parse Excel/CSV (use xlsx library in main process)
- Validation: SKU uniqueness, category existence
- Preview before import
- Error report with row numbers

---

## 8. Error Handling

| Error Code | Description | User Message (ID) |
|------------|-------------|-------------------|
| PROD_001 | SKU/Barcode duplicate | "SKU/Barcode sudah digunakan" |
| PROD_002 | Product not found | "Produk tidak ditemukan" |
| PROD_003 | Invalid unit conversion | "Konversi satuan tidak valid" |
| PROD_004 | Stock below minimum | "Stok di bawah batas minimum" |
| CAT_001 | Category has products | "Kategori masih memiliki produk" |

---

## 9. Testing Strategy

### Unit Tests
- `product.service.test.ts` - Unit conversion calculations
- `product.repo.test.ts` - CRUD with unit relationships
- `import.parser.test.ts` - Excel/CSV parsing

### E2E Tests
- Create product with multiple units
- Sell product in different units
- Import 1000 products from CSV
- Search/filter products

---

## 10. Multi-Unit Examples

```typescript
// Product: Gula Pasir
const product = {
  id: 'gula-001',
  name: 'Gula Pasir',
  baseUnit: 'gram',
  stock: 5000,  // 5000 grams total
};

const units = [
  { unitName: 'kg', conversionFactor: 1000, priceSell: 25000 },
  { unitName: '1/2 kg', conversionFactor: 500, priceSell: 13000 },
  { unitName: '1/4 kg', conversionFactor: 250, priceSell: 7000 },
];

// Selling 1 kg => stock becomes 4000 grams
// Selling 2 x 1/2 kg => stock becomes 4000 grams
// Selling 4 x 1/4 kg => stock becomes 4000 grams
```
