# [RPT-001] Report Repo: Aggregation Queries Skeleton

**Module**: Reports & Analytics
**Priority**: P0
**Complexity**: M
**Spec Reference**: reports-analytics-spec.md Section 3, Section 4

## Description
Repo layer untuk query agregasi menggunakan Drizzle/knex raw atau ORM aggregation. Fungsi dasar: getTransactionsInRange, getSalesByProduct, getSalesByCategory, getCurrentStockReport. Gunakan mock data atau test DB seed untuk development awal.

## Acceptance Criteria
- [ ] `getTransactionsInRange(start, end)` mengembalikan array transactions
- [ ] `getSalesByProduct(start, end)` mengembalikan array {productId, productName, quantity, revenue}
- [ ] `getSalesByCategory(start, end)` mengembalikan array {categoryId, categoryName, revenue}
- [ ] `getCurrentStockReport()` mengembalikan array {productId, currentStock, baseUnit, status}
- [ ] Queries menggunakan SQLite aggregation (SUM, COUNT, GROUP BY)

## Dependencies
- [CORE-003] (DB)
- [POS-008] (transactions table ideally, but can seed test data)
