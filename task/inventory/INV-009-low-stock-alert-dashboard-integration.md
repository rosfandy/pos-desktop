# [INV-009] LowStockAlert Component & Dashboard Integration

**Module**: Inventory
**Priority**: P1
**Complexity**: S
**Spec Reference**: inventory-spec.md Section 7

## Description
Komponen alert banner/card untuk produk dengan stok rendah. Tampilkan di dashboard dan halaman inventory. Tombol one-click untuk buat stock-in.

## Acceptance Criteria
- [ ] Alert banner muncul di dashboard jika ada low stock
- [ ] Card list produk low stock dengan current vs min stock
- [ ] Klik produk langsung redirect ke StockInForm dengan produk terpilih
- [ ] Auto-refresh setelah stock-in berhasil

## Dependencies
- [INV-008]
- [PROD-009] (product low stock service)
