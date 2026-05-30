# Technical Spec: POS Terminal

## 1. Overview

Module utama kasir untuk transaksi penjualan. Fitur: cart, multi-payment, hold/save bill, void/refund, print receipt, cash drawer.

**Linked PRD Sections**: 5.1, 8.2 (POS wireframe, keyboard shortcuts), Appendix A, B

---

## 2. Architecture

```
electron/
├── ipc/
│   └── transaction.ts         # Transaction IPC handlers
├── services/
│   └── transaction/
│       ├── repo.ts            # Transaction repository
│       └── service.ts         # Transaction business logic
├── printers/
│   └── escpos.ts              # Thermal printer integration
└── db/
    └── schema.ts              # transactions, transaction_items

src/
├── components/
│   └── pos/
│       ├── POSTerminal.tsx    # Main layout
│       ├── ProductGrid.tsx    # Product display with search
│       ├── CartPanel.tsx      # Shopping cart
│       ├── CartItem.tsx       # Individual cart row
│       ├── PaymentModal.tsx   # Payment dialog
│       ├── HoldBillModal.tsx  # Save/load held bills
│       └── ReceiptPreview.tsx # Receipt before print
├── pages/
│   └── POSPage.tsx
├── stores/
│   └── cartStore.ts
└── hooks/
    ├── useBarcode.ts          # Barcode scanner listener
    └── useKeyboardShortcuts.ts
```

---

## 3. Data Models

### Transactions Table

```typescript
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').unique().notNull(),  // INV-20260528-0001
  customerId: text('customer_id').references(() => customers.id),
  userId: text('user_id').references(() => users.id).notNull(),
  subtotal: integer('subtotal').notNull().default(0),          // in cents
  discount: integer('discount').notNull().default(0),         // in cents
  discountPercent: integer('discount_percent').default(0),     // 0-100
  tax: integer('tax').notNull().default(0),                     // in cents
  taxPercent: integer('tax_percent').default(0),               // e.g., 10 for 10%
  total: integer('total').notNull().default(0),               // in cents
  paymentMethod: text('payment_method', { 
    enum: ['cash', 'debit', 'qris', 'transfer'] 
  }).notNull(),
  amountPaid: integer('amount_paid').notNull().default(0),    // in cents
  change: integer('change').notNull().default(0),             // in cents
  status: text('status', { 
    enum: ['completed', 'held', 'voided', 'refunded'] 
  }).notNull().default('completed'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  shiftId: text('shift_id').references(() => shifts.id),
});
```

### Transaction Items Table

```typescript
export const transactionItems = sqliteTable('transaction_items', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').references(() => transactions.id).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull().default(1),
  unit: text('unit').notNull().default('pcs'),                  // unit used at time of sale
  price: integer('price').notNull().default(0),                // price per unit in cents
  discount: integer('discount').notNull().default(0),
  total: integer('total').notNull().default(0),                // (price * qty) - discount
});
```

---

## 4. API / IPC Contract

```typescript
interface TransactionAPI {
  // Cart operations
  'transaction:create': (data: CreateTransactionDTO) => Promise<Transaction>;
  'transaction:get': (id: string) => Promise<TransactionWithItems | null>;
  'transaction:list': (filters?: TransactionFilter) => Promise<Transaction[]>;
  
  // Hold/Save bill
  'transaction:hold': (data: HoldTransactionDTO) => Promise<Transaction>;
  'transaction:unhold': (id: string) => Promise<Transaction>;
  'transaction:listHeld': () => Promise<Transaction[]>;
  
  // Void/Refund
  'transaction:void': (id: string, reason: string) => Promise<void>;
  'transaction:refund': (id: string, items?: RefundItemDTO[]) => Promise<Transaction>;
  
  // Printing
  'printer:printReceipt': (transactionId: string) => Promise<void>;
  'printer:openDrawer': () => Promise<void>;
  'printer:test': () => Promise<void>;
}
```

---

## 5. State Management

```typescript
// src/stores/cartStore.ts
interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitConversion: number;      // conversion factor to base unit
  price: number;               // price per unit in cents
  discount: number;            // item-level discount in cents
  total: number;               // calculated total
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax: number;
  taxPercent: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;
  
  addItem: (product: Product, quantity: number, unit: string) => void;
  removeItem: (productId: string, unit: string) => void;
  updateQuantity: (productId: string, unit: string, quantity: number) => void;
  updateItemDiscount: (productId: string, unit: string, discount: number) => void;
  setDiscount: (amount: number, percent?: number) => void;
  setTax: (percent: number) => void;
  setPayment: (method: PaymentMethod, amount: number) => void;
  calculateTotals: () => void;
  clearCart: () => void;
  holdBill: () => Promise<void>;
  pay: () => Promise<Transaction>;
}
```

---

## 6. Component Details

### POSTerminal.tsx
- 3-column layout: Categories (left), Products (center), Cart (right)
- Responsive: collapsible on smaller screens
- Keyboard shortcut handler

### ProductGrid.tsx
- Grid/list toggle view
- Category filter tabs
- Fuzzy search with instant results
- Barcode scanner input (USB HID)
- Product cards with image, name, price

### CartPanel.tsx
- Real-time cart display
- Quantity +/- buttons
- Item discount input
- Cart-level discount & tax
- Payment buttons (Cash, QRIS, Debit, Transfer)
- Total display with large font

### PaymentModal.tsx
- Payment method selection
- Amount input with auto-calculate change
- Quick cash buttons (exact, 50k, 100k)
- Receipt print toggle
- Confirmation before process

---

## 7. Keyboard Shortcuts

| Key | Action | Implementation |
|-----|--------|---------------|
| F2 / Ctrl+F | Focus search | `useKeyboardShortcuts` hook |
| F4 | Open payment | `cartStore.pay()` trigger |
| F5 | Hold bill | `cartStore.holdBill()` |
| F6 | Load held | Show `HoldBillModal` |
| F7 | Reprint last | Call `printer:printReceipt(lastId)` |
| Esc | Cancel/close | Close modals, clear cart if empty |
| + / - | Qty adjust | Increment/decrement selected item |
| Delete | Remove item | Remove selected item from cart |

---

## 8. Receipt Printing

```typescript
// electron/printers/escpos.ts
import { Printer, Image } from 'node-escpos';

export async function printReceipt(transaction: TransactionWithItems): Promise<void> {
  const device = await getPrinterDevice();
  const printer = new Printer(device);
  
  const settings = await settingsRepo.getAll();
  
  printer
    .align('CT')
    .text(settings.storeName || 'TOKO')
    .text(settings.storeAddress || '')
    .text('===============================')
    .align('LT')
    .text(`No: ${transaction.invoiceNumber}`)
    .text(`Kasir: ${transaction.userName}`)
    .text(`Tgl: ${formatDate(transaction.createdAt)}`)
    .text('-------------------------------');
  
  transaction.items.forEach(item => {
    printer.text(`${item.productName} ${item.quantity}${item.unit} ${formatRupiah(item.total)}`);
  });
  
  printer
    .text('-------------------------------')
    .text(`Subtotal: ${formatRupiah(transaction.subtotal)}`)
    .text(`Diskon: ${formatRupiah(transaction.discount)}`)
    .text(`Pajak: ${formatRupiah(transaction.tax)}`)
    .text('===============================')
    .text(`TOTAL: ${formatRupiah(transaction.total)}`)
    .text(`Bayar: ${formatRupiah(transaction.amountPaid)}`)
    .text(`Kembali: ${formatRupiah(transaction.change)}`)
    .text('-------------------------------')
    .align('CT')
    .text('Terima Kasih')
    .cut()
    .close();
}
```

---

## 9. Error Handling

| Error Code | Description | User Message (ID) |
|------------|-------------|-------------------|
| TRANS_001 | Insufficient stock | "Stok tidak mencukupi" |
| TRANS_002 | Invalid payment amount | "Jumlah pembayaran kurang" |
| TRANS_003 | Transaction already voided | "Transaksi sudah dibatalkan" |
| TRANS_004 | No open shift | "Buka shift terlebih dahulu" |
| PRINT_001 | Printer not connected | "Printer tidak terhubung" |
| PRINT_002 | Print failed | "Gagal mencetak struk" |

---

## 10. Testing Strategy

### Unit Tests
- `cart.store.test.ts` - Add/remove items, calculate totals
- `transaction.service.test.ts` - Create transaction with stock update
- `receipt.printer.test.ts` - Receipt format generation

### E2E Tests
- Full transaction flow (add product -> pay cash -> print)
- Barcode scanner input
- Hold and retrieve bill
- Void transaction with authorization
- Offline transaction (disconnect network)
