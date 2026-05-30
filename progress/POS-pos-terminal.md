# Progress: POS-pos Terminal

**Started**: 2026-05-28
**Last Updated**: 2026-05-30

**Status**: 🟢 PHASE 9 COMPLETE — Keyboard navigation polish, cart focus, payment modal fix

---

## Phase Progress

| Phase                           | Items                     | Status        |
| ------------------------------- | ------------------------- | ------------- |
| Phase 1                         | POS-008, POS-009          | ✅ COMPLETE    |
| Phase 2                         | POS-001                   | ✅ COMPLETE    |
| Phase 3                         | POS-002, POS-003, POS-006 | ✅ COMPLETE    |
| Phase 4                         | POS-004, POS-005, POS-014 | ✅ COMPLETE    |
| Phase 5                         | POS-007, POS-011          | ✅ COMPLETE    |
| Phase 6                         | POS-010                   | ✅ COMPLETE    |
| Phase 7                         | POS-012, POS-013          | ✅ COMPLETE    |
| Phase 8 — Halaman Kasir Rebuild | —                         | ✅ COMPLETE    |
| Phase 9 — Keyboard Nav + Bug Fix | —                         | ✅ COMPLETE    |


---

## ✅ COMPLETE (Phase 1–7)

### Phase 1 — Database Layer ✅
- `electron/db/schema.ts` — transactions, transaction_items
- `electron/services/transaction/repo.ts` — CRUD + invoice
- `electron/services/transaction/service.ts` — create/hold/void/refund + stock restore
- `electron/ipc/transaction.ts` — 8 handlers
- `electron/preload.ts` — whitelisted

### Phase 2 — Cart State ✅
- `src/stores/cartStore.ts` — full cart state + `loadHeldBill` / `deleteHeldBill`
- `pay(userId?, shiftId?)` — parameterized untuk production

### Phase 3 — Layout & Product ✅
- `src/components/pos/POSTerminal.tsx` — 3-column layout (untuk dibersihkan nanti)
- `src/components/pos/ProductGrid.tsx` — real API + mock fallback + barcode lookup
- `src/hooks/useBarcode.ts` — USB HID scanner detection

### Phase 4 — Cart & Payment ✅
- `src/components/pos/CartPanel.tsx` — items, qty, item discount, cart discount, tax, Bayar button
- `src/components/pos/PaymentModal.tsx` — Cash/QRIS/Debit/Transfer, quick amounts, change calc
- `src/components/pos/ReceiptPreview.tsx` — thermal receipt preview with print button

### Phase 5 — Shortcuts & Hold ✅
- `src/hooks/useKeyboardShortcuts.ts` — F2~F7, Escape, +/-, Delete
- `src/components/pos/HoldBillModal.tsx` — list, load, delete held bills

### Phase 6 — Printer ✅
- `electron/services/printer/service.ts` — printReceipt, printTestPage, openCashDrawer
- `src/hooks/usePrinter.ts` — printer hook
- ~~`electron-pos-printer` dependency~~ → **Diganti native Electron `webContents.print()`** (2026-05-30)
  - `electron-pos-printer` v1.4.0 menggunakan callback-based `webContents.print()` → tidak compatible dengan Electron 33 (Promise-based API)
  - Rewrite: buat hidden BrowserWindow, load HTML via data URI, panggil `webContents.print(opts, callback)` native
  - `openCashDrawer` → kirim ESC/POS raw command via PowerShell `System.Printing`
  - Dependency dihapus dari `package.json`

### Phase 7 — Void/Refund + Real Product API ✅
- `src/components/pos/VoidRefundModal.tsx` — PIN auth, partial refund, status validation
- `electron/services/transaction/service.ts` — stock restore on void/refund
- `electron/services/product/service.ts` — sql.js queries + mock fallback
- `src/components/pos/ProductGrid.tsx` — real API integration

---

## ✅ COMPLETE — Halaman Kasir Rebuild (2026-05-28)

### `src/components/pos/ProductTable.tsx` (NEW — replaces ProductGrid)
- **Table-based** product list (bukan card/grid)
- Kolom: No | Kode/Barcode | Nama Produk | Harga | Stok | Aksi
- **Search by name, barcode, atau ID** — input di atas tabel, F2 untuk focus
- **Sortable columns** — klik header untuk sort asc/desc (Kode/Nama/Harga/Stok)
- **Keyboard navigation** — Arrow Up/Down highlight baris, Enter tambah ke keranjang
- **Flash feedback** — baris yang ditambah flash hijau (400ms)
- **Stok warning** — merah jika ≤5, kuning jika ≤20
- **Barcode scanner** terintegrasi via custom event `barcode:scan`
- **Tidak ada kategori tab** — semua produk ditampilkan, dicari via search

### `src/pages/POSTerminalPage.tsx` (REBUILT)
- **2-column layout** — produk kiri (flex-1 ~60%), keranjang kanan (fixed 400px ~40%)
- Tidak ada CategoryList sidebar (dihapus sepenuhnya)
- Toolbar: Test Print, Void/Refund, Tahan Bill
- Toast dengan tipe success/error/info (berbeda warna)
- Receipt preview sebagai modal overlay dengan tombol Cetak Struk & Selesai
- HoldBillModal, VoidRefundModal terintegrasi

### `src/components/pos/VoidRefundModal.tsx` (FIX)
- **Bug fix**: Modal tidak lagi muncul otomatis saat halaman dibuka
- `mounted` state — komponen return `null` sampai `open={true}` secara eksplisit
- Reset state internal saat modal dibuka (selectedTx, pin, authorized, refundItems, mode)
- Delay unmount 350ms saat ditutup (animasi close tidak terpotong)
- Prop `modal` pada Dialog untuk mencegah close saat klik luar

### `src/components/pos/CartPanel.tsx` (POLISH)
- Badge jumlah item di header
- Empty state lebih deskriptif
- Tombol Bayar lebih besar (h-11) dengan hint F4
- Layout lebih rapat untuk desktop

### App.tsx
- Route `/pos` tetap menggunakan `POSTerminalPage`
- Tidak ada perubahan routing

---

## Blockers
- ~~`electron-pos-printer` v1.4.0 tidak compatible dengan Electron 33~~ → **Fixed 2026-05-30**: Diganti dengan native Electron `webContents.print()`

---

## ✅ COMPLETE — Phase 9: Keyboard Nav Polish + Bug Fixes (2026-05-29)

### `src/components/pos/ProductTable.tsx` (KEYBOARD NAV REWORK)
- **Hapus semua keyboard event handler** (Arrow/Enter/Escape/F2/mouse hover) — bersihkan dulu
- **Restore auto-focus search input on mount** — `searchRef` + `useEffect(100ms delay)`
- **ArrowDown/Up dari search input → highlight tabel** (dropdown-select behaviour):
  - **Fokus tetap di input**, tidak pindah ke tabel
  - ArrowDown: increment highlight, ArrowUp: decrement highlight
  - Dari no-highlight (-1): ArrowDown → baris 1, ArrowUp → baris terakhir
  - Enter dari search + ada highlight → tambah ke keranjang
  - Backspace/huruf/Delete dari input: **tidak di-prevent** — typing normal
- **`onKeyDown` dipindahkan ke root div** (agar event dari search input + tabel sama-sama bubbling ke handler)
- **Dispatch `pos:focus-cart-item`** setelah Enter add → fokus pindah ke cart item

### `src/hooks/useKeyboardShortcuts.ts` (FIX BACKSPACE + ARROW QTY)
- **Bug fix**: Hapus `'Delete'` dan `'Backspace'` dari exception list → saat di input, key ini di-skip (tidak di-prevent), input bisa hapus karakter normal
- **Tambah `ArrowLeft`** → `adjustQty(-1)` (kurangi qty cart item)
- **Tambah `ArrowRight`** → `adjustQty(1)` (tambah qty cart item)
- **Selector fix**: `[data-cart-item] button:focus` → `[data-cart-item-product-id]:focus` (cart item container sekarang focusable, bukan button)

### `src/components/pos/CartPanel.tsx` (FOCUS SUPPORT + DATA ATTRIBUTES)
- Setiap cart item: `data-cart-item-product-id`, `data-cart-item-unit`, `data-cart-item-qty`
- Setiap cart item: `tabIndex={-1}` — focusable secara programmatic
- Setiap cart item: `focus:ring-2 focus:ring-indigo-500` — visual ring saat fokus
- `useEffect` listen custom event `pos:focus-cart-item` → query DOM by productId+unit → `el.focus()`

### `src/components/pos/PaymentModal.tsx` (FIX AUTO-CLOSE BUG)
- **Bug**: Modal auto-close saat diklik di mana pun
- **Root cause**: Double overlay — shadcn `<Dialog>` (punya overlay sendiri) + `div fixed inset-0` manual. Dua overlay punya mekanisme close yang bentrok.
- **Fix**: 
  - Buang `<Dialog>` wrapper (POSTerminalPage sudah conditional render)
  - Tambah `if (!open) return null;` early return
  - Pertahankan satu overlay manual dengan `onClick={onClose}` + `stopPropagation` di konten

### Keyboard Navigation Flow (Final)
| Aksi | Hasil |
|------|-------|
| Auto-focus on mount | Kursor langsung di input search |
| Ketik di search | Filter produk |
| ArrowDown/Up dari search | Navigasi highlight di tabel **(fokus tetap di input)** |
| Enter (ada highlight) | Tambah ke keranjang → **fokus pindah ke cart item** |
| ArrowLeft (fokus di cart) | Kurangi qty -1 |
| ArrowRight (fokus di cart) | Tambah qty +1 |
| Backspace/Delete di input | Hapus karakter normal |
| Escape | Reset highlight + fokus ke search |

---

---

## ✅ COMPLETE — Phase 10: Replace electron-pos-printer with Native Electron Print (2026-05-30)

### Root Cause
`electron-pos-printer` v1.4.0 menggunakan callback-based `webContents.print()` API yang sudah diganti dengan Promise-based API di Electron 33. Dengan `silent: true`, timeout tidak di-set, sehingga Promise menggantung selamanya — tidak ada error, tidak ada output cetak.

### Fix
- **`electron/services/printer/service.ts`** — Rewrite total:
  - `buildReceiptHtml(data)`: generate HTML struk langsung (tanpa library)
  - `electronPrint(html, printerName)`: hidden BrowserWindow → load HTML via data URI → `webContents.print()` dengan callback → timeout 30s → clean up window
  - `openCashDrawer(printerName)`: ESC/POS raw command via PowerShell `System.Printing` (fallback)
- **`package.json`**: hapus dependency `electron-pos-printer`
- Typecheck ✅, Lint ✅

### Remaining
- Perlu testing real printer setelah deploy
- Jika `webContents.print()` gagal di silent mode, coba alternative: `electron-printer` atau `node-printer` native module

## Changelog
See `changelog/POS-terminal.md` and `changelog/POS-014-pos-terminal-page.md` and `changelog/POS-016-kasir-rebuild.md`
