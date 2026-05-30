# Technical Spec: Shift Management

## 1. Overview

Module untuk mengelola shift kasir (buka/tutup shift), tracking uang masuk/keluar, dan laporan shift.

**Linked PRD Sections**: 5.6 (session management), 7.5 (shifts table)

---

## 2. Architecture

```
electron/
├── ipc/
│   └── shift.ts                # Shift IPC handlers
├── services/
│   └── shift/
│       ├── repo.ts             # Shift repository
│       └── service.ts          # Shift calculations
└── db/
    └── schema.ts               # shifts

src/
├── components/
│   └── shift/
│       ├── OpenShiftModal.tsx   # Open shift dialog
│       ├── CloseShiftModal.tsx  # Close shift dialog
│       ├── ShiftSummary.tsx     # Current shift status
│       └── ShiftHistory.tsx     # Past shifts list
├── pages/
│   └── ShiftPage.tsx
└── stores/
    └── shiftStore.ts
```

---

## 3. Data Models

Already defined in core-setup-spec.md, repeated here for reference:

```typescript
export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  openedAt: integer('opened_at', { mode: 'timestamp' }).notNull(),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  openingCash: integer('opening_cash').notNull().default(0),
  closingCash: integer('closing_cash'),
  expectedCash: integer('expected_cash'),     // opening + cash sales
  totalSales: integer('total_sales').notNull().default(0),
  totalCashSales: integer('total_cash_sales').notNull().default(0),
  totalNonCashSales: integer('total_non_cash_sales').notNull().default(0),
  discrepancy: integer('discrepancy'),            // closing - expected
  status: text('status', { enum: ['open', 'closed'] }).notNull().default('open'),
  notes: text('notes'),
});
```

---

## 4. API / IPC Contract

```typescript
interface ShiftAPI {
  // Shift operations
  'shift:open': (data: OpenShiftDTO) => Promise<Shift>;
  'shift:close': (data: CloseShiftDTO) => Promise<Shift>;
  'shift:current': () => Promise<Shift | null>;
  'shift:get': (id: string) => Promise<Shift | null>;
  'shift:list': (filters?: ShiftFilter) => Promise<Shift[]>;
  
  // Summary
  'shift:summary': (shiftId: string) => Promise<ShiftSummary>;
}
```

---

## 5. Shift Logic

```typescript
// electron/services/shift/service.ts

export async function openShift(data: OpenShiftDTO): Promise<Shift> {
  const existing = await shiftRepo.getOpenShift(data.userId);
  if (existing) {
    throw new Error('SHIFT_001');
  }
  
  return await shiftRepo.create({
    id: generateId(),
    userId: data.userId,
    openedAt: new Date(),
    openingCash: data.openingCash,
    status: 'open',
  });
}

export async function closeShift(data: CloseShiftDTO): Promise<Shift> {
  const shift = await shiftRepo.getById(data.shiftId);
  if (!shift || shift.status === 'closed') {
    throw new Error('SHIFT_002');
  }
  
  // Calculate expected cash
  const transactions = await transactionRepo.getByShiftId(data.shiftId);
  const cashSales = transactions
    .filter(t => t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.total, 0);
  
  const expectedCash = shift.openingCash + cashSales;
  const discrepancy = data.closingCash - expectedCash;
  
  return await shiftRepo.update(data.shiftId, {
    closedAt: new Date(),
    closingCash: data.closingCash,
    expectedCash,
    totalSales: transactions.reduce((sum, t) => sum + t.total, 0),
    totalCashSales: cashSales,
    totalNonCashSales: transactions
      .filter(t => t.paymentMethod !== 'cash')
      .reduce((sum, t) => sum + t.total, 0),
    discrepancy,
    status: 'closed',
    notes: data.notes,
  });
}
```

---

## 6. State Management

```typescript
// src/stores/shiftStore.ts
interface ShiftState {
  currentShift: Shift | null;
  shiftHistory: Shift[];
  loading: boolean;
  
  checkCurrentShift: () => Promise<void>;
  openShift: (openingCash: number) => Promise<void>;
  closeShift: (closingCash: number, notes?: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
}
```

---

## 7. Component Details

### OpenShiftModal.tsx
- Input: Uang modal awal (opening cash)
- Display: Nama kasir, waktu buka
- Validation: Tidak boleh buka 2 shift bersamaan

### CloseShiftModal.tsx
- Input: Uang fisik di tangan (closing cash)
- Display: 
  - Total penjualan
  - Penjualan tunai vs non-tunai
  - Uang yang seharusnya ada (expected)
  - Selisih (discrepancy)
- Notes textarea untuk keterangan selisih
- Confirmation before close

### ShiftSummary.tsx
- Status badge (Open/Closed)
- Duration timer (if open)
- Total sales today
- Quick action: Close shift button

---

## 8. Integration with POS

- POS Terminal checks for open shift on load
- If no open shift: redirect to OpenShiftModal
- All transactions linked to current shift
- Receipt shows shift info (optional)

---

## 9. Error Handling

| Error Code | Description | User Message (ID) |
|------------|-------------|-------------------|
| SHIFT_001 | Shift already open | "Anda sudah memiliki shift yang aktif" |
| SHIFT_002 | No open shift | "Tidak ada shift yang bisa ditutup" |
| SHIFT_003 | Negative cash | "Jumlah uang tidak valid" |

---

## 10. Testing Strategy

### Unit Tests
- `shift.service.test.ts` - Open/close logic, discrepancy calc
- `shift.repo.test.ts` - CRUD

### E2E Tests
- Open shift flow
- Transaction during shift
- Close shift with discrepancy
- Verify transaction linked to shift
