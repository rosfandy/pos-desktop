# [POS-007] Keyboard Shortcuts Hook

**Module**: POS Terminal
**Priority**: P0
**Complexity**: S
**Spec Reference**: pos-terminal-spec.md Section 7

## Description
Custom hook `useKeyboardShortcuts` yang menangkap tombol F2, F4, F5, F6, F7, Esc, +/-, Delete. Panggil callback yang sesuai dari cartStore atau UI.

## Acceptance Criteria
- [ ] F2/Ctrl+F: fokus ke search box
- [ ] F4: buka PaymentModal
- [ ] F5: hold bill
- [ ] F6: load held bill modal
- [ ] F7: reprint last receipt (placeholder)
- [ ] Esc: tutup modal / batal cart jika kosong
- [ ] +/-: tambah/kurangi qty item yang ter-select di cart
- [ ] Delete: hapus item yang ter-select di cart

## Dependencies
None
