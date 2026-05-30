# [RPT-008] Integrate Real Transaction Data for Dashboard

**Module**: Reports & Analytics
**Priority**: P1
**Complexity**: S
**Spec Reference**: reports-analytics-spec.md Section 5

## Description
Ganti mock data di Dashboard Summary Service dengan query ke transaction repo yang sebenarnya. DashboardCards menampilkan data real-time dari database.

## Acceptance Criteria
- [ ] Dashboard summary mengambil data dari SQLite via IPC
- [ ] Data akurat sesuai transaksi tersimpan
- [ ] Auto-refresh setiap 5 menit memanggil IPC ulang
- [ ] Low stock alert mengambil dari product/inventory service
- [ ] Held bills count mengambil dari transaction repo

## Dependencies
- [RPT-002]
- [POS-008] (transaction repo)
- [PROD-009] (low stock service)
