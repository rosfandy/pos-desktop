# [RPT-009] Recharts Integration: SalesChart & ProductChart

**Module**: Reports & Analytics
**Priority**: P1
**Complexity**: M
**Spec Reference**: reports-analytics-spec.md Section 7

## Description
Integrasi library Recharts untuk grafik. SalesChart: AreaChart untuk trend penjualan harian. ProductChart: PieChart untuk top 10 produk by revenue atau quantity.

## Acceptance Criteria
- [ ] SalesChart menampilkan area chart dengan data harian
- [ ] Toggle: revenue vs transaction count
- [ ] ProductChart menampilkan pie chart top 10 produk
- [ ] Toggle: by revenue atau by quantity
- [ ] Responsive chart size
- [ ] Empty state jika tidak ada data

## Dependencies
- [RPT-004]
