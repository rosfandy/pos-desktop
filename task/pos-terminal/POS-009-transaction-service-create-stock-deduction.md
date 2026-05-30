# [POS-009] Transaction Service: Create + Stock Deduction

**Module**: POS Terminal
**Priority**: P0
**Complexity**: M
**Spec Reference**: pos-terminal-spec.md Section 4

## Description
Business logic transaksi: validasi stok (mock stock check), hitung total, simpan ke DB, kurangi stok produk (integration dengan inventory log). IPC handler `transaction:create`.

## Acceptance Criteria
- [ ] Validasi stok sebelum create: error TRANS_001 jika stok tidak cukup
- [ ] Hitung subtotal, discount, tax, total dengan benar
- [ ] Simpan transaction + items atomic
- [ ] Stok produk berkurang sesuai konversi satuan
- [ ] Buat inventory log type 'sale' untuk setiap item
- [ ] Return transaction object lengkap dengan items

## Dependencies
- [POS-008]
- [INVENTORY-002] (untuk stock deduction bisa di-mock dengan todo comment, atau inventory service minimal)
