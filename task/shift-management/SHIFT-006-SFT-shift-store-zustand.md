# [SHIFT-006] Shift Store (Zustand)

**Module**: Shift Management
**Priority**: P0
**Complexity**: S
**Spec Reference**: shift-management-spec.md Section 6

## Description
Zustand store untuk state shift: currentShift, shiftHistory, loading. Actions: checkCurrentShift, openShift, closeShift, fetchHistory.

## Acceptance Criteria
- [ ] `checkCurrentShift` dipanggil saat app mount
- [ ] `openShift` memanggil IPC dan update state
- [ ] `closeShift` memanggil IPC dan update state
- [ ] `fetchHistory` memuat riwayat shift
- [ ] Redirect ke OpenShiftModal jika tidak ada shift aktif (di POS)

## Dependencies
- [SHIFT-001]
