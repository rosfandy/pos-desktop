# [SHIFT-004] CloseShiftModal Component

**Module**: Shift Management
**Priority**: P0
**Complexity**: M
**Spec Reference**: shift-management-spec.md Section 7

## Description
Modal dialog untuk menutup shift. Input: uang fisik di tangan (closingCash). Display ringkaman: total penjualan, penjualan tunai, penjualan non-tunai, expected cash, discrepancy. Notes textarea. Konfirmasi.

## Acceptance Criteria
- [ ] Input closingCash dengan format rupiah
- [ ] Display totalSales, totalCashSales, totalNonCashSales
- [ ] Display expectedCash (terhitung otomatis)
- [ ] Display discrepancy (closing - expected) dengan warna merah jika minus
- [ ] Notes textarea untuk keterangan selisih
- [ ] Konfirmasi sebelum close

## Dependencies
- [SHIFT-002]
