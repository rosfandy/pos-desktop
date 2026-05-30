# [SHIFT-010] Multi-Shift Per Day Tracking

**Module**: Shift Management
**Priority**: P2
**Complexity**: S
**Spec Reference**: shift-management-spec.md

## Description
Dukungan untuk multiple shift dalam satu hari (kasir shift pagi dan shift malam). Validasi: hanya 1 shift aktif per user, tapi bisa buka-tutup-buka.

## Acceptance Criteria
- [ ] User bisa buka shift baru setelah menutup shift sebelumnya di hari yang sama
- [ ] History menampilkan multiple shift per hari
- [ ] Summary per hari menggabungkan multiple shift

## Dependencies
- [SHIFT-001]
