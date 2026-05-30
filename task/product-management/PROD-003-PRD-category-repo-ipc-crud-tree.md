# [PROD-003] Category Repo + IPC: CRUD + Tree

**Module**: Product Management
**Priority**: P0
**Complexity**: S
**Spec Reference**: product-management-spec.md Section 4

## Description
Repo dan IPC untuk kategori. List categories dalam bentuk tree (flat list dengan parent-child relationship). Validasi delete: tidak bisa hapus kategori yang punya produk.

## Acceptance Criteria
- [ ] `category:list` mengembalikan semua kategori
- [ ] `category:create` membuat kategori baru
- [ ] `category:update` mengubah nama dan parent
- [ ] `category:delete` error CAT_001 jika masih punya produk
- [ ] Bisa membuat sub-kategori (nested)

## Dependencies
- [PROD-001]
