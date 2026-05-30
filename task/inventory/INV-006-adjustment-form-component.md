# [INV-006] AdjustmentForm Component

**Module**: Inventory
**Priority**: P0
**Complexity**: S
**Spec Reference**: inventory-spec.md Section 7

## Description
Form penyesuaian stok: tampilkan current stock, input new stock, auto-calculate adjustment amount. Wajib mengisi reason. Butuh autorisasi (mock admin check).

## Acceptance Criteria
- [ ] Tampilkan current stock dari produk terpilih
- [ ] Input new stock (base unit)
- [ ] Auto-calculate selisih adjustment
- [ ] Reason wajib diisi
- [ ] Konfirmasi sebelum submit
- [ ] Butuh autorisasi (PIN atau role check placeholder)

## Dependencies
- [INV-002]
- [INV-003]
