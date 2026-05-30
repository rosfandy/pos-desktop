# [SHIFT-001] Shift Repo + IPC: Open, Close, Current, List

**Module**: Shift Management
**Priority**: P0
**Complexity**: M
**Spec Reference**: shift-management-spec.md Section 3, Section 4

## Description
Repo layer untuk CRUD shifts. IPC handlers: `shift:open`, `shift:close`, `shift:current`, `shift:get`, `shift:list`. Validasi: hanya boleh ada 1 shift open per user.

## Acceptance Criteria
- [ ] `shift:open` membuat shift baru dengan status 'open'
- [ ] Error SHIFT_001 jika user sudah punya shift open
- [ ] `shift:close` update shift: closedAt, closingCash, status 'closed'
- [ ] Error SHIFT_002 jika tidak ada shift yang aktif
- [ ] `shift:current` mengembalikan shift open milik user saat ini
- [ ] `shift:list` dengan filter by user, date range, status
- [ ] Field discrepancy, expectedCash, totalSales dihitung saat close

## Dependencies
- [CORE-003] (DB foundation)
