# Technical Spec: Customer CRM

## 1. Overview

Module untuk manajemen pelanggan, membership/loyalty points, dan riwayat transaksi.

**Linked PRD Sections**: 5.4

---

## 2. Architecture

```
electron/
├── ipc/
│   └── customer.ts             # Customer IPC handlers
├── services/
│   └── customer/
│       ├── repo.ts             # Customer repository
│       └── service.ts          # Loyalty point calculation
└── db/
    └── schema.ts               # customers

src/
├── components/
│   └── customer/
│       ├── CustomerList.tsx
│       ├── CustomerForm.tsx
│       ├── CustomerCard.tsx
│       ├── CustomerSearch.tsx    # Search by phone/name
│       ├── LoyaltyCard.tsx       # Points & tier display
│       └── TransactionHistory.tsx
├── pages/
│   └── CustomersPage.tsx
└── stores/
    └── customerStore.ts
```

---

## 3. Data Models

```typescript
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').unique(),
  email: text('email'),
  address: text('address'),
  points: integer('points').notNull().default(0),
  tier: text('tier', { enum: ['bronze', 'silver', 'gold', 'platinum'] }).notNull().default('bronze'),
  totalSpent: integer('total_spent').notNull().default(0),     // cumulative spending in cents
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

### Tier Rules

| Tier | Min. Spending | Point Multiplier |
|------|--------------|-----------------|
| Bronze | Rp 0 | 1x |
| Silver | Rp 1.000.000 | 1.2x |
| Gold | Rp 5.000.000 | 1.5x |
| Platinum | Rp 10.000.000 | 2x |

---

## 4. API / IPC Contract

```typescript
interface CustomerAPI {
  'customer:list': (filters?: CustomerFilter) => Promise<Customer[]>;
  'customer:get': (id: string) => Promise<Customer | null>;
  'customer:create': (data: CreateCustomerDTO) => Promise<Customer>;
  'customer:update': (id: string, data: UpdateCustomerDTO) => Promise<Customer>;
  'customer:delete': (id: string) => Promise<void>;
  'customer:transactions': (id: string) => Promise<Transaction[]>;
  'customer:addPoints': (id: string, points: number) => Promise<Customer>;
  'customer:redeemPoints': (id: string, points: number) => Promise<{ customer: Customer; discount: number }>;
}
```

---

## 5. Loyalty Logic

```typescript
// electron/services/customer/service.ts

export function calculatePoints(
  amount: number,           // in cents
  tier: CustomerTier
): number {
  const multipliers = {
    bronze: 1,
    silver: 1.2,
    gold: 1.5,
    platinum: 2,
  };
  
  // 1 point per Rp 10.000
  const basePoints = Math.floor(amount / 1000000); // 10.000 in cents
  return Math.floor(basePoints * multipliers[tier]);
}

export function calculateTier(totalSpent: number): CustomerTier {
  const thresholds = [
    { tier: 'platinum', min: 1000000000 },  // 10jt in cents
    { tier: 'gold', min: 500000000 },         // 5jt in cents
    { tier: 'silver', min: 100000000 },      // 1jt in cents
  ];
  
  for (const { tier, min } of thresholds) {
    if (totalSpent >= min) return tier as CustomerTier;
  }
  return 'bronze';
}
```

---

## 6. State Management

```typescript
// src/stores/customerStore.ts
interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  searchQuery: string;
  loading: boolean;
  
  fetchCustomers: (filters?: CustomerFilter) => Promise<void>;
  searchCustomers: (query: string) => Promise<void>;
  createCustomer: (data: CreateCustomerDTO) => Promise<void>;
  updateCustomer: (id: string, data: UpdateCustomerDTO) => Promise<void>;
  selectCustomer: (id: string) => void;
  calculateDiscount: (points: number) => number;
}
```

---

## 7. Component Details

### CustomerSearch.tsx
- Quick search by phone (for loyalty lookup at POS)
- Name/phone search with autocomplete
- Show points & tier in dropdown

### LoyaltyCard.tsx
- Display points balance
- Tier badge with color
- Progress to next tier
- Redeem points button

### TransactionHistory.tsx
- List of past transactions
- Total spending calculation
- Date range filter

---

## 8. Integration with POS

When customer is selected at POS:
1. Show loyalty tier in header
2. Auto-apply tier-based point multiplier
3. Show "Redeem Points" button in payment
4. Update points after successful transaction

---

## 9. Error Handling

| Error Code | Description | User Message (ID) |
|------------|-------------|-------------------|
| CUST_001 | Phone duplicate | "Nomor telepon sudah terdaftar" |
| CUST_002 | Insufficient points | "Poin tidak cukup" |
| CUST_003 | Customer not found | "Pelanggan tidak ditemukan" |

---

## 10. Testing Strategy

### Unit Tests
- `loyalty.service.test.ts` - Point calculation, tier assignment
- `customer.repo.test.ts` - CRUD operations

### E2E Tests
- Register customer at POS
- Apply loyalty discount
- Points accumulation after purchase
- Tier upgrade after spending threshold
