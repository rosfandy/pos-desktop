# [PROD-014] Product Management Page (Halaman Produk)

**Module**: Product Management
**Priority**: P0
**Complexity**: M
**Spec Reference**: product-management-spec.md Section 3

## Description
Buat halaman utama manajemen produk yang menggabungkan semua komponen yang sudah ada (ProductList, ProductForm, CategoryTree, BulkImport, BulkExport) menjadi satu halaman terpadu.

## Acceptance Criteria
- [ ] Halaman `/products` atau route yang sesuai terdefinisi di router
- [ ] Header: judul "Manajemen Produk" + tombol "Tambah Produk", "Import", "Export"
- [ ] Sidebar: CategoryTree untuk filter kategori
- [ ] Toggle view: Daftar (table) / Grid (card)
- [ ] ProductForm dialog untuk create/edit
- [ ] BulkImportDialog dan BulkExportDialog terintegrasi
- [ ] State dari useProductStore
- [ ] Semua teks dalam bahasa Indonesia

## Dependencies
- PROD-005 (Product Store)
- PROD-006 (ProductList + ProductCard)
- PROD-007 (ProductForm)
- PROD-008 (CategoryTree)
- PROD-010 (Bulk Import)
- PROD-011 (Bulk Export)
