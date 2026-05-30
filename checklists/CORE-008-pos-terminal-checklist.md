# Implementation Checklist: CORE-008 POS Terminal

**Module**: POS Terminal
**Priority**: P0
**Based on**: pos-terminal-spec.md + task/pos-terminal/POS-*

---

## Phase 1 — Database Layer (Depends on CORE-003)

- [ ] **POS-008**: Define `transactions` + `transaction_items` schema in `electron/db/schema.ts`
  - Fields: id, invoiceNumber, customerId, userId, subtotal, discount, discountPercent, tax, taxPercent, total, paymentMethod, amountPaid, change, status, createdAt, shiftId
  - Fields: id, transactionId, productId, quantity, unit, price, discount, total
  - Verify: `npx drizzle-kit generate` runs without error

- [ ] **POS-008**: Create migration `database/migrations/0001_transactions.sql`
  - Verify: `npm run migrate` creates tables successfully

- [ ] **POS-008**: Implement `electron/services/transaction/repo.ts`
  - `createTransaction(data)` — atomic insert transaction + items
  - `getTransactionById(id)` — join with items
  - `listTransactions(filters)` — filter by date, status
  - `generateInvoiceNumber()` — format `INV-YYYYMMDD-XXXX`
  - `updateTransactionStatus(id, status)` — void/refund
  - Verify: Repo compiles, basic CRUD works in isolation

- [ ] **POS-009**: Implement `electron/services/transaction/service.ts`
  - `createTransaction(dto)` — validate stock (mock), calculate totals, save + deduct stock
  - `holdTransaction(dto)` — save with status 'held', no stock deduction
  - `unholdTransaction(id)` — load held back to cart (via IPC)
  - `voidTransaction(id, reason)` — require admin auth, return stock, create inventory log 'return'
  - `refundTransaction(id, items)` — partial refund support
  - Verify: Service compiles, unit test for stock validation edge cases

- [ ] **POS-008**: Implement `electron/ipc/transaction.ts`
  - `transaction:create`, `transaction:get`, `transaction:list`
  - `transaction:hold`, `transaction:unhold`, `transaction:listHeld`
  - `transaction:void`, `transaction:refund`
  - Verify: All handlers registered and return expected shapes

- [ ] **POS-008**: Add transaction channels to `electron/preload.ts` whitelist
  - Verify: `window.electronAPI.transaction.*` accessible in renderer

---

## Phase 2 — Cart State (Frontend, No DB Required)

- [ ] **POS-001**: Create `src/stores/cartStore.ts` (Zustand)
  - State: items[], customerId, subtotal, discount, discountPercent, tax, taxPercent, total, amountPaid, change, paymentMethod
  - Actions: `addItem(product, qty, unit)`, `removeItem(productId, unit)`, `updateQuantity(productId, unit, qty)`
  - Actions: `updateItemDiscount(productId, unit, discount)`, `setDiscount(amount, percent?)`, `setTax(percent)`, `setPayment(method, amount)`
  - Actions: `calculateTotals()`, `clearCart()`, `holdBill()`, `pay()`
  - Verify: Store initializes, `calculateTotals()` gives correct math for edge cases (100% discount, 0% tax, qty 0)

---

## Phase 3 — POS Layout & Product Grid

- [ ] **POS-002**: Create `src/components/pos/POSTerminal.tsx`
  - 3-column layout: Categories (left, collapsible), Products (center), Cart (right, fixed width)
  - Responsive breakpoints: collapse sidebar < 1024px, cart drawer on mobile
  - Touch targets >= 44x44px
  - Verify: Layout stable with 100+ mock products, no horizontal scroll

- [ ] **POS-003**: Create `src/components/pos/ProductGrid.tsx`
  - Product cards: image placeholder, name, price
  - Category filter tabs
  - Fuzzy search box (use fuse.js or simple `includes()` for MVP)
  - 20+ mock products array
  - Klik card → `cartStore.addItem()`
  - Verify: Search < 200ms for 1000 items, category filter works, click adds to cart

- [ ] **POS-006**: Create `src/hooks/useBarcode.ts`
  - Listen to keyboard events, detect rapid input (< 50ms/char) + Enter suffix
  - Distinguish scanner vs manual typing
  - Callback with scanned barcode string
  - Verify: Simulated rapid key events trigger callback, normal typing in search box not interfered

---

## Phase 4 — Cart Panel & Payment

- [ ] **POS-004**: Create `src/components/pos/CartPanel.tsx`
  - List cart items: name, qty, unit, price, total
  - +/- qty buttons, item discount input
  - Cart-level discount (nominal + percent toggle), tax input
  - Large font total display, "Bayar" button disabled when empty
  - Verify: Adding/removing items updates total in real-time

- [ ] **POS-005**: Create `src/components/pos/PaymentModal.tsx`
  - Modal: payment method selector (Cash, QRIS, Debit, Transfer)
  - Cash: amount paid input + quick buttons (Exact, +50rb, +100rb)
  - Auto-calculate change, error if change < 0 (TRANS_002)
  - Print receipt toggle
  - Confirm before processing
  - Verify: Modal opens, quick buttons work, negative change blocked

- [ ] **POS-014**: Create `src/components/pos/ReceiptPreview.tsx`
  - Formatted receipt preview from cart data
  - Real-time update when cart changes
  - Toggle print/preview in PaymentModal
  - Verify: Preview matches receipt format

---

## Phase 5 — Keyboard Shortcuts & Hold Bill

- [ ] **POS-007**: Create `src/hooks/useKeyboardShortcuts.ts`
  - F2/Ctrl+F → focus search
  - F4 → open PaymentModal
  - F5 → `cartStore.holdBill()`
  - F6 → show HoldBillModal
  - F7 → reprint last receipt (placeholder)
  - Esc → close modal / cancel
  - +/- → qty adjust selected cart item
  - Delete → remove selected cart item
  - Verify: All shortcuts fire correct callbacks

- [ ] **POS-011**: Implement hold/save bill
  - `cartStore.holdBill()` → IPC `transaction:hold` with status 'held'
  - `transaction:listHeld` → list of held bills
  - `transaction:unhold(id)` → load back to cart
  - HoldBillModal to select/delete held bills
  - Verify: F5 saves, F6 loads, held bill doesn't deduct stock

---

## Phase 6 — Thermal Printer

- [ ] **POS-010**: Create `electron/printers/escpos.ts`
  - `printReceipt(transaction)` — format header, items, totals, footer with `node-escpos`
  - `openCashDrawer()` — pulse signal to drawer
  - `testPrint()` — print test page
  - Receipt template reads storeName/address from settings
  - Verify: Test print outputs correctly formatted receipt, drawer opens

- [ ] **POS-010**: Add printer IPC handlers in `electron/ipc/transaction.ts` or new `electron/ipc/printer.ts`
  - `printer:printReceipt(transactionId)`, `printer:openDrawer`, `printer:test`
  - Verify: IPC calls trigger printer, errors PRINT_001/PRINT_002 on failure

---

## Phase 7 — Void/Refund & Integration

- [ ] **POS-012**: Implement void/refund
  - Void requires admin PIN (CORE-005 auth)
  - Stock restored, inventory log 'return' created
  - Partial refund support
  - Verify: Void with admin auth succeeds, stock returns, voided tx can't be voided again

- [ ] **POS-013**: Replace mock data with real product API
  - ProductGrid fetches from `product:list` IPC
  - Barcode scanner → `product:getByBarcode` → add to cart
  - Fallback empty state if no products
  - Verify: Real products display, barcode scan adds correct item

- [ ] **POS-009**: Wire `pay()` in cartStore → `transaction:create` IPC
  - Full flow: add items → payment → create transaction → print receipt → open drawer
  - Verify: End-to-end transaction creates DB record, prints receipt, opens drawer

---

## Phase 8 — Kitchen Display (P2)

- [ ] **POS-015**: Kitchen Display System trigger
  - Open separate KDS window (BrowserWindow)
  - Send order items via IPC
  - Auto-update KDS on new orders
  - Verify: KDS window opens, receives order data

---

## Verification Gates

```
npm run typecheck   → ✅ PASS (0 errors)
npm run lint        → ✅ PASS (0 errors)
npm test            → ✅ PASS (cart store + barcode hook tests)
```
