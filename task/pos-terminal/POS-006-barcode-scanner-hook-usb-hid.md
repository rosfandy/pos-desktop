# [POS-006] Barcode Scanner Hook (USB HID)

**Module**: POS Terminal
**Priority**: P0
**Complexity**: S
**Spec Reference**: pos-terminal-spec.md Section 2

## Description
Custom hook `useBarcode` yang listen ke keyboard input. Deteksi barcode scanner (rapid input dengan suffix Enter) vs manual typing. Trigger callback dengan scanned barcode string.

## Acceptance Criteria
- [ ] Hook mendeteksi input cepat dari barcode scanner (< 50ms per char)
- [ ] Membedakan scanner input vs user typing di search box
- [ ] Callback menerima barcode string lengkap
- [ ] Barcode scanner tidak menginterferi input form lain
- [ ] Unit test dengan simulated rapid key events

## Dependencies
None
