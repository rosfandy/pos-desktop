# [INV-004] StockInForm Component

**Module**: Inventory
**Priority**: P0
**Complexity**: M
**Spec Reference**: inventory-spec.md Section 7

## Description
Form untuk pencatatan stok masuk. Product selector (searchable dropdown), quantity dengan unit selector, cost price input, supplier info (optional), reason/notes. Support multi-item stock-in.

## Acceptance Criteria
- [ ] Product selector dengan search
- [ ] Unit selector mengambil dari product_units produk terpilih
- [ ] Auto-convert ke base unit saat submit
- [ ] Cost price input untuk COGS
- [ ] Supplier field (optional)
- [ ] Bisa tambah multiple items sekaligus
- [ ] Submit memanggil `inventory:stockIn`

## Dependencies
- [INV-002]
