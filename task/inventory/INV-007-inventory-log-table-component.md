# [INV-007] InventoryLogTable Component

**Module**: Inventory
**Priority**: P0
**Complexity**: S
**Spec Reference**: inventory-spec.md Section 7

## Description
Tabel riwayat perubahan stok (audit trail). Kolom: tanggal, produk, tipe, qty, unit, reason, user. Filter by date range, product, type. Sortable.

## Acceptance Criteria
- [ ] Tabel menampilkan log dengan pagination
- [ ] Filter by date range picker
- [ ] Filter by product (searchable)
- [ ] Filter by type (multi-select)
- [ ] Sort by date descending default

## Dependencies
- [INV-002]
