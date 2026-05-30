# [SHIFT-002] Shift Business Logic: Open/Close with Mock Transactions

**Module**: Shift Management
**Priority**: P0
**Complexity**: M
**Spec Reference**: shift-management-spec.md Section 5

## Description
Business logic shift open/close. Saat close: hitung expectedCash = openingCash + cashSales. Hitung discrepancy = closingCash - expectedCash. Gunakan mock transaction array untuk calculation agar tidak ter-block POS module.

## Acceptance Criteria
- [ ] `openShift` validasi tidak ada shift aktif
- [ ] `closeShift` menghitung expectedCash dari opening + mock cash sales
- [ ] `closeShift` menghitung totalSales dari mock transactions
- [ ] `closeShift` menghitung totalCashSales dan totalNonCashSales
- [ ] Discrepancy dihitung dengan benar
- [ ] Update shift record dengan semua field

## Dependencies
- [SHIFT-001]
