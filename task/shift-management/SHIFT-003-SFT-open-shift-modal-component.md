# [SHIFT-003] OpenShiftModal Component

**Module**: Shift Management
**Priority**: P0
**Complexity**: S
**Spec Reference**: shift-management-spec.md Section 7

## Description
Modal dialog untuk membuka shift. Input: uang modal awal (openingCash). Display: nama kasir, waktu buka. Tombol konfirmasi.

## Acceptance Criteria
- [ ] Input openingCash dengan format rupiah
- [ ] Validasi: openingCash >= 0 (error SHIFT_003 jika negatif)
- [ ] Display nama kasir dari authStore
- [ ] Waktu buka = current time
- [ ] Setelah buka, redirect ke POS Terminal

## Dependencies
- [SHIFT-001]
- [CORE-007] (authStore untuk user)
