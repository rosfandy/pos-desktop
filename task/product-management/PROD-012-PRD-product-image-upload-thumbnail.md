# [PROD-012] Product Image Upload & Thumbnail

**Module**: Product Management
**Priority**: P1
**Complexity**: S
**Spec Reference**: product-management-spec.md Section 2

## Description
Upload gambar produk di main process. Simpan di folder app data. Generate thumbnail. Tampilkan di ProductCard dan ProductGrid.

## Acceptance Criteria
- [ ] Upload gambar via file picker
- [ ] Validasi format (jpg, png, webp) dan size (< 2MB)
- [ ] Simpan path ke database
- [ ] Tampilkan thumbnail di grid/card
- [ ] Placeholder jika tidak ada gambar

## Dependencies
- [PROD-007]
