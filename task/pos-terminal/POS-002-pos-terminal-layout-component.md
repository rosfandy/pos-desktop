# [POS-002] POSTerminal Layout Component

**Module**: POS Terminal
**Priority**: P0
**Complexity**: M
**Spec Reference**: pos-terminal-spec.md Section 6

## Description
Layout 3 kolom: kategori (kiri), produk (tengah), cart (kanan). Responsive: collapsible sidebar kategori di layar kecil, cart bisa collapse. Touch-friendly sizing.

## Acceptance Criteria
- [ ] Tiga kolom terlihat jelas di layar desktop (>=1024px)
- [ ] Panel kategori bisa collapse/expand
- [ ] Panel cart fixed width, tidak overflow
- [ ] Touch target minimal 44x44px untuk tombol utama
- [ ] Layout stabil saat produk list panjang

## Dependencies
- [CORE-002] (shadcn/ui base components)
