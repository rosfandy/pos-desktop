# Changelog: POS Terminal — Halaman Utuh

**Last Updated**: 2026-05-28
**Status**: ✅ UI Kasir lengkap terintegrasi (REBUILT — 2-column, table-based)

---

## POS-014: Halaman POS Terminal Utuh

**Files Changed**:
- `src/pages/POSTerminalPage.tsx` — NEW (initial) → FULL REWRITE (rebuild)
- `src/App.tsx` — Modified (route `/pos` menggunakan POSTerminalPage)
- `src/components/pos/CartPanel.tsx` — Modified (tambah prop `onPay`)
- `src/stores/cartStore.ts` — Modified (`pay()` menerima `userId` & `shiftId` parameter)
- `src/lib/api.ts` — Modified (tambah `Transaction`, `TransactionItem` interfaces)

### Fitur yang Diintegrasikan (Initial)

| Fitur | Status |
|-------|--------|
| 3-column layout (kategori + produk + keranjang) | ⚠️ Replaced |
| ProductGrid dengan real API + mock fallback | ⚠️ Replaced |
| CartPanel dengan tombol Bayar | ✅ |
| PaymentModal (Cash/QRIS/Debit/Transfer) | ✅ |
| Alur Bayar → Transaksi → Cetak Struk | ✅ |
| ReceiptPreview + print button | ✅ |
| Keyboard shortcuts (F2~F7, Escape, +/-, Delete) | ✅ |
| Barcode scanner (USB HID) | ✅ |
| HoldBillModal (F6) | ✅ |
| VoidRefundModal (F7 / tombol toolbar) | ✅ |
| Toolbar POS (Test Print, Void/Refund, jam) | ✅ |
| Error handling + retry | ✅ |

---

## POS-016: Rebuild Halaman Kasir — Table-based Product List (2026-05-28)

**Problem**: Halaman kasir sebelumnya memiliki banyak cacat:
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

---

### Alur End-to-End

```
User klik "Bayar" di CartPanel
  → PaymentModal terbuka
  → User pilih metode & jumlah
  → Konfirmasi → cartStore.setPayment(method, amount)
  → cartStore.pay(userId) → transactionCreate IPC
  → Jika berhasil: setLastTransaction(tx)
  → ReceiptPreview terbuka dengan data transaksi
  → printReceiptForTransaction(tx) → printer:print IPC
  → openCashDrawer() → printer:open-drawer IPC
```

### Perbaikan Bug

| Bug | Perbaikan |
|-----|-----------|
| `cartStore.pay()` tidak ada `userId`/`shiftId` | Tambah parameter `overrideUserId` & `shiftId` |
| `Transaction` type hilang di renderer | Tambah `Transaction`, `TransactionItem` di `@/lib/api` |
| `VoidRefundModal` pakai type lokal | Ganti dengan import dari `@/lib/api` |
| `CartPanel` unused `setPayment` | Hapus dari destructuring |
| `POSTerminalPage` tidak ada route | Tambah route `/pos` di `App.tsx` |
| **VoidRefundModal muncul otomatis** | `mounted` state + conditional render + `modal` prop |
| **Kategori tab tidak dibutuhkan** | Dihapus sepenuhnya dari ProductTable + POSTerminalPage |
| **ProductGrid card layout tidak efisien** | Diubah menjadi ProductTable (table layout) |

### Breaking Changes

Tidak ada breaking changes. Semua perubahan adalah penambahan fitur dan perbaikan bug.
