# [RPT-012] Report Filtering by Cashier, Category, Product

**Module**: Reports & Analytics
**Priority**: P1
**Complexity**: S
**Spec Reference**: reports-analytics-spec.md Section 4

## Description
Tambahan filter pada SalesReportPage: filter by cashier (dropdown user), filter by category (dropdown), filter by product (searchable).

## Acceptance Criteria
- [ ] Filter dropdown kasir mengambil dari users table
- [ ] Filter dropdown kategori mengambil dari categories table
- [ ] Filter produk dengan autocomplete/search
- [ ] Semua filter bisa dikombinasikan dengan date range

## Dependencies
- [RPT-004]
- [CORE-005] (users data)
- [PROD-003] (categories)
