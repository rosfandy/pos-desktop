# [SHIFT-005] ShiftSummary Component (Header Widget)

**Module**: Shift Management
**Priority**: P0
**Complexity**: S
**Spec Reference**: shift-management-spec.md Section 7

## Description
Widget ringkasan shift di header/app shell. Status badge (Open/Closed), duration timer (jika open), total sales hari ini. Quick action: tombol tutup shift.

## Acceptance Criteria
- [ ] Badge status: hijau "Shift Aktif" atau abu-abu "Shift Tutup"
- [ ] Timer durasi shift yang berjalan (HH:MM:SS)
- [ ] Total sales hari ini (dari shift atau mock)
- [ ] Tombol "Tutup Shift" aktif jika shift open
- [ ] Klik badge/status redirect ke ShiftPage

## Dependencies
- [SHIFT-001]
