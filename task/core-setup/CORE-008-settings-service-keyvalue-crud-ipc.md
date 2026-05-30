# [CORE-008] Settings Service: Key-Value CRUD IPC

**Module**: Core & Setup
**Priority**: P0
**Complexity**: S
**Spec Reference**: core-setup-spec.md Section 3, Section 4

## Description
Implementasi repo dan service untuk tabel settings (key-value). IPC handlers: `settings:get`, `settings:set`, `settings:getAll`. Default settings: storeName, storeAddress, taxRate.

## Acceptance Criteria
- [ ] Bisa get single setting by key
- [ ] Bisa set/update setting key
- [ ] Bisa getAll settings sebagai Record<string, string>
- [ ] Default settings ter-seed saat database inisialisasi
- [ ] Error SETTINGS_001 jika key tidak ditemukan

## Dependencies
- [CORE-003]
- [CORE-004]
