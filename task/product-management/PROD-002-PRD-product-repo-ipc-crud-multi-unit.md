# [PROD-002] Product Repo + IPC: CRUD with Multi-Unit

**Module**: Product Management
**Priority**: P0
**Complexity**: M
**Spec Reference**: product-management-spec.md Section 4

## Description
Repo layer untuk CRUD produk termasuk units. IPC handlers: `product:list`, `product:get`, `product:create`, `product:update`, `product:delete`, `product:checkStock`. List mendukung filter by category, search, active status.

## Acceptance Criteria
- [ ] `product:list` mengembalikan produk dengan units ter-join
- [ ] `product:create` menyimpan produk + units secara atomic
- [ ] `product:update` bisa mengubah produk dan units (replace units)
- [ ] `product:delete` soft delete (set isActive false) atau hard delete jika belum ada transaksi
- [ ] `product:checkStock` mengembalikan stock, minStock, isLow
- [ ] Error PROD_001 jika SKU/Barcode duplikat

## Dependencies
- [PROD-001]
