# [PROD-007] ProductForm Component (Create/Edit)

**Module**: Product Management
**Priority**: P0
**Complexity**: L
**Spec Reference**: product-management-spec.md Section 7

## Description
Form produk lengkap: nama, SKU, barcode scanner input, kategori select, baseUnit, priceBuy, priceSell, minStock, image upload placeholder. Dynamic rows untuk multi-unit: nama satuan, conversionFactor, override price.

## Acceptance Criteria
- [ ] Field semua sesuai schema
- [ ] Barcode input support via scanner
- [ ] Dynamic unit rows: add/remove/edit
- [ ] Auto-suggest conversionFactor berdasarkan nama unit (kg=1000, lusin=12, dll)
- [ ] Validasi: SKU unik, barcode unik, conversionFactor > 0
- [ ] Submit menyimpan produk + units atomic
- [ ] Mode edit memuat data existing

## Dependencies
- [PROD-005]
- [PROD-004]
