# [POS-003] ProductGrid with Fuzzy Search (Mock Data)

**Module**: POS Terminal
**Priority**: P0
**Complexity**: M
**Spec Reference**: pos-terminal-spec.md Section 6

## Description
Komponen ProductGrid yang menampilkan daftar produk dalam grid card. Integrasi fuse.js atau fuzzy search manual. Filter by category tabs. Gunakan mock product array (20+ items) agar tidak ter-block oleh Product Management module.

## Acceptance Criteria
- [ ] Grid menampilkan product card dengan nama, harga, gambar placeholder
- [ ] Search box melakukan fuzzy search real-time (< 200ms untuk 1000 item)
- [ ] Category tabs memfilter produk
- [ ] Klik product card menambahkan ke cart (via cartStore)
- [ ] Scroll virtualization atau pagination untuk performance

## Dependencies
- [POS-002]
