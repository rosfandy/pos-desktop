# [CORE-011] Backup & Restore Database

**Module**: Core & Setup
**Priority**: P1
**Complexity**: M
**Spec Reference**: core-setup-spec.md Section 6 (Settings Components)

## Description
Fitur backup database ke file `.db` dan restore dari file. Implementasi di main process dengan dialog file picker. Progress indicator untuk backup/restore.

## Acceptance Criteria
- [ ] Backup membuat copy file `.db` ke lokasi yang dipilih user
- [ ] Restore mengganti file `.db` dengan file yang dipilih (restart app)
- [ ] Validasi file restore (cek SQLite header)
- [ ] Backup 1000+ transaksi selesai dalam < 5 detik (AC-3)

## Dependencies
- [CORE-003]
