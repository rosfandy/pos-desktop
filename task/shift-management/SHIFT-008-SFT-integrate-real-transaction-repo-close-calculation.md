# [SHIFT-008] Integrate Real Transaction Repo for Close Calculation

**Module**: Shift Management
**Priority**: P1
**Complexity**: S
**Spec Reference**: shift-management-spec.md Section 5

## Description
Ganti mock transaction data di `closeShift` dengan data nyata dari transaction repo. Query transactions by shiftId untuk menghitung totalSales, cashSales, nonCashSales.

## Acceptance Criteria
- [ ] `closeShift` query transactions dari database by shiftId
- [ ] Perhitungan totalSales akurat berdasarkan transaksi nyata
- [ ] Perhitungan cashSales dari transaksi dengan paymentMethod 'cash'
- [ ] Perhitungan nonCashSales dari transaksi lain
- [ ] Discrepancy akurat

## Dependencies
- [SHIFT-002]
- [POS-008] (transaction repo)
