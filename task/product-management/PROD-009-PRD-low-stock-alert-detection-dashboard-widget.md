# [PROD-009] Low Stock Alert Detection & Dashboard Widget

**Module**: Product Management
**Priority**: P1
**Complexity**: S
**Spec Reference**: product-management-spec.md Section 2, PRD 5.2

## Description
Service yang secara berkala (atau saat app focus) mengecek produk dengan stok <= minStock. Tampilkan alert banner/card di dashboard dan halaman produk.

## Acceptance Criteria
- [ ] Alert ter-trigger saat stock <= minStock
- [ ] Dashboard widget menampilkan jumlah produk low stock
- [ ] Klik widget redirect ke produk list dengan filter low stock
- [ ] Alert real-time setelah transaksi/penjualan

## Dependencies
- [PROD-005]
