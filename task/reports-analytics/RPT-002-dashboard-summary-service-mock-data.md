# [RPT-002] Dashboard Summary Service (Mock Data)

**Module**: Reports & Analytics
**Priority**: P0
**Complexity**: M
**Spec Reference**: reports-analytics-spec.md Section 5

## Description
Service `getDashboardSummary` yang menghitung ringkasan: penjualan hari ini, minggu ini, bulan ini. Gunakan mock transaction array untuk development awal agar tidak ter-block POS module.

## Acceptance Criteria
- [ ] Hitung total sales untuk hari ini (00:00 - 23:59)
- [ ] Hitung total sales untuk 7 hari terakhir
- [ ] Hitung total sales untuk 30 hari terakhir
- [ ] Hitung jumlah transaksi dan average ticket
- [ ] Hitung jumlah held bills (mock)
- [ ] Hitung jumlah low stock alerts (mock/integration dengan product service)

## Dependencies
- [RPT-001]
