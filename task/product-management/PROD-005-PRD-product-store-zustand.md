# [PROD-005] Product Store (Zustand)

**Module**: Product Management
**Priority**: P0
**Complexity**: S
**Spec Reference**: product-management-spec.md Section 6

## Description
Zustand store untuk state manajemen produk: products, categories, selectedProduct, loading, lowStockAlerts. Actions: fetchProducts, fetchCategories, createProduct, updateProduct, deleteProduct, checkLowStock.

## Acceptance Criteria
- [ ] `fetchProducts` memuat produk dari IPC ke state
- [ ] `fetchCategories` memuat kategori dari IPC
- [ ] CRUD actions memanggil IPC dan refresh list
- [ ] `checkLowStock` memfilter produk dengan stock <= minStock
- [ ] Loading state untuk async actions

## Dependencies
- [PROD-002]
- [PROD-003]
