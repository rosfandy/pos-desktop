# [INV-003] Stock Calculation Service

**Module**: Inventory
**Priority**: P0
**Complexity**: M
**Spec Reference**: inventory-spec.md Section 5

## Description
Service untuk menghitung current stock berdasarkan inventory logs. Fungsi `getCurrentStock(productId)` dan `validateStockAvailability(productId, qty, unit, units)`.

## Acceptance Criteria
- [ ] `getCurrentStock` menghitung total dari semua log (in/return tambah, out/sale/damage/expired kurang, adjustment absolute)
- [ ] `validateStockAvailability` mengkonversi qty ke base unit lalu bandingkan
- [ ] Return true/false untuk ketersediaan stok
- [ ] Unit tests untuk scenario: stock in, stock out, adjustment, sale, return
- [ ] Performance: < 100ms untuk produk dengan 1000+ log

## Dependencies
- [INV-002]
