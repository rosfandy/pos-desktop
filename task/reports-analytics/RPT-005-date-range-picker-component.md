# [RPT-005] DateRangePicker Component

**Module**: Reports & Analytics
**Priority**: P0
**Complexity**: S
**Spec Reference**: reports-analytics-spec.md Section 7

## Description
Komponen pemilih rentang tanggal reusable untuk seluruh laporan. Support: hari ini, kemarin, 7 hari terakhir, 30 hari terakhir, bulan ini, custom range.

## Acceptance Criteria
- [ ] Preset buttons: Hari Ini, Kemarin, 7 Hari, 30 Hari, Bulan Ini
- [ ] Custom range dengan 2 date input (from - to)
- [ ] Validasi: end date >= start date
- [ ] Emit event/onChange dengan Date objects
- [ ] Reusable di semua halaman laporan

## Dependencies
None (pure UI)
