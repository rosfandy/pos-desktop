# [CORE-009] Settings UI: Store Settings Form + SettingsPage

**Module**: Core & Setup
**Priority**: P0
**Complexity**: S
**Spec Reference**: core-setup-spec.md Section 6

## Description
Halaman pengaturan toko dengan form: nama toko, alamat, nomor telepon, logo upload placeholder, PPN/tax rate. Gunakan shadcn/ui form components.

## Acceptance Criteria
- [ ] Form menampilkan current settings dari database
- [ ] Update setting langsung persist ke SQLite
- [ ] Validasi input (tax rate 0-100, required fields)
- [ ] Toast notification sukses/gagal

## Dependencies
- [CORE-002]
- [CORE-008]
