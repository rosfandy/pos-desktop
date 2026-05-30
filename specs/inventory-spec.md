	# Technical Spec: Inventory Management

## 1. Overview

Module untuk tracking stok masuk/keluar, adjustment, dan audit trail. Terintegrasi dengan module Product dan POS Terminal.

**Linked PRD Sections**: 5.3, 7.5 (inventory_logs), Appendix C

---

## 2. Architecture

```
electron/
├── ipc/
│   └── inventory.ts            # Inventory IPC handlers
├── services/
│   └── inventory/
│       ├── repo.ts             # Inventory log repository
│       └── service.ts          # Stock calculation & validation
└── db/
    └── schema.ts               # inventory_logs

src/
├── components/
│   └── inventory/
│       ├── StockInForm.tsx     # Receive stock
│       ├── StockOutForm.tsx    # Deduct/usage stock
│       ├── AdjustmentForm.tsx  # Correction/damage/loss
│       ├── StockLogTable.tsx   # Audit trail display
│       └── LowStockAlert.tsx   # Alert banner/card
├── pages/
│   └── InventoryPage.tsx
└── stores/
    └── inventoryStore.ts
```

---

## 3. Data Models

### Inventory Logs Table

```typescript
export const inventoryLogs = sqliteTable('inventory_logs', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id).notNull(),
  type: text('type', { 
    enum: ['in', 'out', 'adjustment', 'sale', 'return', 'damage', 'expired'] 
  }).notNull(),
  quantity: integer('quantity').notNull(),                  // in base unit
  unit: text('unit').notNull(),                             // display unit
  conversionFactor: integer('conversion_factor').notNull().default(1),
  reason: text('reason'),                                   // explanation
  referenceId: text('reference_id'),                        // transaction_id or source
  userId: text('user_id').references(() => users.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

### Stock Movement Types

| Type | Description | Trigger |
|------|-------------|---------|
| `in` | Stock masuk (beli, retur) | Manual stock-in form |
| `out` | Stock keluar non-penjualan | Manual stock-out form |
| `sale` | Penjualan | POS transaction |
| `return` | Retur dari customer | Refund transaction |
| `adjustment` | Koreksi stok | Adjustment form |
| `damage` | Rusak/expired | Adjustment form |

---

## 4. API / IPC Contract

```typescript
interface InventoryAPI {
  // Stock operations
  'inventory:stockIn': (data: StockInDTO) => Promise<InventoryLog>;
  'inventory:stockOut': (data: StockOutDTO) => Promise<InventoryLog>;
  'inventory:adjust': (data: AdjustmentDTO) => Promise<InventoryLog>;
  
  // Queries
  'inventory:logs': (filters?: InventoryFilter) => Promise<InventoryLogWithProduct[]>;
  'inventory:currentStock': (productId: string) => Promise<number>;
  'inventory:lowStock': () => Promise<Product[]>;
  'inventory:movement': (productId: string, period?: DateRange) => Promise<StockMovement[]>;
  
  // Multi-location
  'inventory:transfer': (data: TransferDTO) => Promise<InventoryLog[]>;
}
```

---

## 5. Stock Calculation Logic

```typescript
// electron/services/inventory/service.ts

export async function getCurrentStock(productId: string): Promise<number> {
  const logs = await inventoryRepo.getLogsByProduct(productId);
  
  return logs.reduce((stock, log) => {
    switch (log.type) {
      case 'in':
      case 'return':
        return stock + log.quantity;
      case 'out':
      case 'sale':
      case 'damage':
      case 'expired':
        return stock - log.quantity;
      case 'adjustment':
        return log.quantity; // absolute value after adjustment
      default:
        return stock;
    }
  }, 0);
}

export async function validateStockAvailability(
  productId: string, 
  requestedQuantity: number,
  unitName: string,
  productUnits: ProductUnit[]
): Promise<boolean> {
  const currentStock = await getCurrentStock(productId);
  const conversionFactor = productUnits.find(u => u.unitName === unitName)?.conversionFactor || 1;
  const baseQuantity = requestedQuantity * conversionFactor;
  
  return currentStock >= baseQuantity;
}
```

---

## 6. State Management

```typescript
// src/stores/inventoryStore.ts
interface InventoryState {
  logs: InventoryLogWithProduct[];
  lowStockProducts: Product[];
  loading: boolean;
  
  fetchLogs: (filters?: InventoryFilter) => Promise<void>;
  stockIn: (data: StockInDTO) => Promise<void>;
  stockOut: (data: StockOutDTO) => Promise<void>;
  adjustStock: (data: AdjustmentDTO) => Promise<void>;
  checkLowStock: () => Promise<void>;
  getStockMovement: (productId: string) => Promise<StockMovement[]>;
}
```

---

## 7. Component Details

### StockInForm.tsx
- Product selector (searchable)
- Quantity input with unit selector
- Cost price input (for COGS calculation)
- Supplier info (optional)
- Reason/notes
- Multi-item support (bulk stock-in)

### StockOutForm.tsx
- Similar to StockIn but for deductions
- Predefined reasons: rusak, hilang, expired, sampling

### AdjustmentForm.tsx
- Current stock display
- New stock input
- Auto-calculate adjustment amount
- Reason required
- Authorization (manager/admin)

### LowStockAlert.tsx
- Alert banner on dashboard
- Product cards with current vs min stock
- One-click to create PO/stock-in

---

## 8. Multi-Unit Stock Tracking

When selling 1/2 kg sugar:

```typescript
// Log the sale in base unit
const log = {
  productId: 'gula-001',
  type: 'sale',
  quantity: 500,              // 500 grams (base unit)
  unit: '1/2 kg',             // display unit
  conversionFactor: 500,      // to base unit
  referenceId: 'trans-001',   // link to transaction
};

// Current stock: 5000g -> 4500g after sale
```

---

## 9. Error Handling

| Error Code | Description | User Message (ID) |
|------------|-------------|-------------------|
| INV_001 | Negative stock | "Stok tidak boleh negatif" |
| INV_002 | Invalid adjustment | "Nilai adjustment tidak valid" |
| INV_003 | Unauthorized | "Perlu autorisasi manager" |
| INV_004 | Product not found | "Produk tidak ditemukan" |

---

## 10. Testing Strategy

### Unit Tests
- `inventory.service.test.ts` - Stock calculation, validation
- `inventory.repo.test.ts` - Log CRUD
- `stock.alert.test.ts` - Low stock detection

### E2E Tests
- Stock in flow with unit conversion
- Sale auto-deducts correct base quantity
- Adjustment with authorization
- Low stock alert display
