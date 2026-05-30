# [POS-004] CartPanel Component

**Module**: POS Terminal
**Priority**: P0
**Complexity**: M
**Spec Reference**: pos-terminal-spec.md Section 6

## Description
Panel cart real-time di sebelah kanan. Menampilkan daftar item dengan qty +/-, item discount input, cart-level discount & tax input. Total dengan font besar. Tombol pembayaran.

## Acceptance Criteria
- [ ] Cart item menampilkan nama, qty, unit, harga, total
- [ ] Tombol +/- untuk ubah qty
- [ ] Input discount per item (rupiah)
- [ ] Input discount cart-level (nominal/persen toggle)
- [ ] Input tax persen
- [ ] Total ditampilkan dengan font besar dan terupdate real-time
- [ ] Tombol "Bayar" disabled jika cart kosong

## Dependencies
- [POS-001]
- [POS-002]
