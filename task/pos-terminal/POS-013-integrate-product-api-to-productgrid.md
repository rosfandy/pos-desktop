# [POS-013] Integrate Product API ke ProductGrid (Remove Mock)

**Module**: POS Terminal
**Priority**: P1
**Complexity**: S
**Spec Reference**: pos-terminal-spec.md Section 6

## Description
Ganti mock data di ProductGrid dengan data nyata dari `product:list` IPC. Integrasi barcode scanner dengan lookup produk by barcode.

## Acceptance Criteria
- [ ] ProductGrid menampilkan produk dari database via IPC
- [ ] Barcode scanner langsung mencari produk by barcode dan menambahkan ke cart
- [ ] Fuzzy search menggunakan data dari database
- [ ] Fallback ke mock data jika produk list kosong (empty state)

## Dependencies
- [POS-003]
- [PROD-002] (product list IPC)
