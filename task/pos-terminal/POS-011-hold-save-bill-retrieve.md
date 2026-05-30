# [POS-011] Hold / Save Bill & Retrieve

**Module**: POS Terminal
**Priority**: P1
**Complexity**: M
**Spec Reference**: pos-terminal-spec.md Section 4

## Description
Simpan cart sebagai transaksi dengan status 'held'. List held bills bisa di-retrieve kembali ke cart. IPC handlers: `transaction:hold`, `transaction:unhold`, `transaction:listHeld`.

## Acceptance Criteria
- [ ] F5 menyimpan cart sebagai held transaction
- [ ] Held transaction disimpan ke DB dengan status 'held'
- [ ] F6 menampilkan modal list held bills
- [ ] Bisa pilih held bill untuk load ke cart
- [ ] Held bill bisa di-delete dari list
- [ ] Stok tidak berkurang untuk held bill

## Dependencies
- [POS-008]
