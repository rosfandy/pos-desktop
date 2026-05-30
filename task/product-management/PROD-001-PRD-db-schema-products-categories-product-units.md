# [PROD-001] DB Schema: Products, Categories, Product_Units

**Module**: Product Management
**Priority**: P0
**Complexity**: M
**Spec Reference**: product-management-spec.md Section 3

## Description
Definisi schema Drizzle untuk tabel `products`, `categories`, `product_units`. Relasi: product -> category (optional), product -> product_units (one-to-many), category -> parent category (self-referential).

## Acceptance Criteria
- [ ] Schema products terdefinisi dengan semua field (sku, barcode, name, categoryId, priceBuy, priceSell, stock, baseUnit, imagePath, minStock, isActive)
- [ ] Schema categories terdefinisi dengan self-reference parentId
- [ ] Schema product_units terdefinisi dengan conversionFactor, priceSell, isDefault
- [ ] Indexes pada barcode, sku, categoryId untuk performance
- [ ] Migration file terbuat dan bisa di-run

## Dependencies
- [CORE-003] (DB setup foundation)
