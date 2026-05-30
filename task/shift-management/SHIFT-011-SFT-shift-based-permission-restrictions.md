# [SHIFT-011] Shift-Based Permission Restrictions

**Module**: Shift Management
**Priority**: P2
**Complexity**: M
**Spec Reference**: PRD Section 5.6

## Description
Batasi fitur POS berdasarkan status shift. Jika tidak ada shift aktif, tidak bisa transaksi (hanya bisa lihat). Manager bisa buka shift untuk kasir lain.

## Acceptance Criteria
- [ ] POS Terminal tidak bisa transaksi jika tidak ada shift aktif
- [ ] Redirect ke OpenShiftModal jika shift belum dibuka
- [ ] Manager/admin bisa buka shift untuk kasir lain
- [ ] Permission check menggunakan role dari authStore

## Dependencies
- [SHIFT-006]
- [CORE-005] (RBAC)
