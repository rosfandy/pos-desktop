# [RPT-003] DashboardCards Component (UI + Mock Data)

**Module**: Reports & Analytics
**Priority**: P0
**Complexity**: S
**Spec Reference**: reports-analytics-spec.md Section 7

## Description
Komponen 4 kartu ringkasan: Penjualan Hari Ini, Minggu Ini, Bulan Ini, Stok Hampir Habis. Auto-refresh setiap 5 menit (placeholder). Navigasi ke laporan detail saat diklik.

## Acceptance Criteria
- [ ] 4 card layout responsive (grid 2x2 mobile, 4x1 desktop)
- [ ] Format rupiah dengan pemisah ribuan
- [ ] Icon dan warna berbeda per card
- [ ] Klik card redirect ke halaman laporan terkait
- [ ] Loading skeleton saat data belum ready
- [ ] Works dengan mock data

## Dependencies
- [RPT-002]
