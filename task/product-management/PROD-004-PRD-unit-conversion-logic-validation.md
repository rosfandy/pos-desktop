# [PROD-004] Unit Conversion Logic & Validation

**Module**: Product Management
**Priority**: P0
**Complexity**: M
**Spec Reference**: product-management-spec.md Section 5

## Description
Service layer untuk konversi satuan. Fungsi `convertToBaseUnit` dan `convertFromBaseUnit`. Validasi: conversionFactor harus > 0, unit name tidak boleh duplikat dalam satu produk.

## Acceptance Criteria
- [ ] `convertToBaseUnit(1, 'kg', units)` = 1000 jika baseUnit 'gram'
- [ ] `convertFromBaseUnit(500, '1/2 kg', units)` = 1
- [ ] Error PROD_003 jika unit tidak ditemukan
- [ ] Error PROD_003 jika conversionFactor <= 0
- [ ] Unit tests untuk semua contoh di Appendix C PRD

## Dependencies
- [PROD-001]
