# [PROD-010] Bulk Import: CSV/Excel Parser + Preview

**Module**: Product Management
**Priority**: P1
**Complexity**: L
**Spec Reference**: product-management-spec.md Section 7

## Description
Import produk dari file Excel/CSV. Parse di main process dengan library xlsx. Preview data sebelum import (validasi SKU uniqueness, category existence). Report error dengan nomor baris.

## Acceptance Criteria
- [ ] Bisa upload file CSV atau Excel
- [ ] Preview 10 baris pertama sebelum import
- [ ] Validasi: SKU unik, kategori ada di database
- [ ] Import 1000 produk dalam < 5 detik
- [ ] Report error dengan nomor baris dan alasan
- [ ] Atomic import: rollback jika ada error

## Dependencies
- [PROD-002]
