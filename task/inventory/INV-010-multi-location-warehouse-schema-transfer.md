# [INV-010] Multi-Location Warehouse Schema + Transfer

**Module**: Inventory
**Priority**: P1
**Complexity**: M
**Spec Reference**: PRD Section 5.3

## Description
Tambah tabel `locations` dan field `locationId` pada inventory_logs. Fitur transfer stok antar lokasi (gudang ke toko). IPC: `inventory:transfer`.

## Acceptance Criteria
- [ ] Tabel locations terdefinisi
- [ ] Inventory log mencatat locationId
- [ ] Transfer mengurangi stok di location asal dan menambah di location tujuan
- [ ] Audit trail transfer tercatat sebagai 2 log entries (out dari A, in ke B)

## Dependencies
- [INV-002]
