# [INV-005] StockOutForm Component

**Module**: Inventory
**Priority**: P0
**Complexity**: S
**Spec Reference**: inventory-spec.md Section 7

## Description
Form untuk pencatatan stok keluar non-penjualan. Mirip StockInForm. Predefined reasons: rusak, hilang, expired, sampling.

## Acceptance Criteria
- [ ] Product selector dengan search
- [ ] Quantity dan unit selector
- [ ] Dropdown reason: rusak, hilang, expired, sampling
- [ ] Custom reason textarea
- [ ] Validasi stok cukup sebelum submit
- [ ] Submit memanggil `inventory:stockOut`

## Dependencies
- [INV-002]
- [INV-003]
