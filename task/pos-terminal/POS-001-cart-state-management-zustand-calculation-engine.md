# [POS-001] Cart State Management (Zustand) with Calculation Engine

**Module**: POS Terminal
**Priority**: P0
**Complexity**: M
**Spec Reference**: pos-terminal-spec.md Section 5

## Description
Implementasi `cartStore` lengkap dengan add/remove item, quantity update, item-level discount, cart-level discount & tax, auto-calculate subtotal, total, change. Support multi-unit dengan conversion factor (gunakan mock product data).

## Acceptance Criteria
- [ ] Bisa add item dengan productId, quantity, unit, price, conversionFactor
- [ ] Bisa remove item dari cart
- [ ] Bisa update quantity (increment/decrement)
- [ ] Item-level discount mengurangi total item
- [ ] Cart-level discount & tax (persen/nominal) menghitung total akurat
- [ ] `calculateTotals()` memperbarui subtotal, total, change otomatis
- [ ] Unit tests untuk edge case: diskon 100%, pajak 0%, quantity 0

## Dependencies
None (mock data)
