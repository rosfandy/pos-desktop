# [RPT-010] StockReportPage

**Module**: Reports & Analytics
**Priority**: P1
**Complexity**: M
**Spec Reference**: reports-analytics-spec.md Section 3

## Description
Halaman laporan stok. Tabel produk dengan current stock, base unit, min stock, status (ok/low/out), nilai stok (priceBuy * stock). Filter by status, category.

## Acceptance Criteria
- [ ] Tabel menampilkan semua produk dengan stok terkini
- [ ] Status badge: hijau (ok), kuning (low), merah (out)
- [ ] Filter by status (ok/low/out) dan category
- [ ] Sort by stock quantity atau stock value
- [ ] Total nilai stok di summary row

## Dependencies
- [RPT-001]
- [PROD-002] (product list IPC)
