# [POS-012] Void / Refund Transaction with Authorization

**Module**: POS Terminal
**Priority**: P1
**Complexity**: M
**Spec Reference**: pos-terminal-spec.md Section 4

## Description
Fitur void transaksi (batalkan) dan refund (retur). Memerlukan autorisasi manager/admin. Update stok kembali saat void/refund.

## Acceptance Criteria
- [ ] Void transaksi memerlukan PIN manager/admin
- [ ] Status transaksi berubah jadi 'voided'
- [ ] Stok produk dikembalikan saat void
- [ ] Refund bisa partial (retur sebagian item)
- [ ] Inventory log type 'return' tercatat
- [ ] Error TRANS_003 jika transaksi sudah voided

## Dependencies
- [POS-009]
- [CORE-005] (auth untuk authorization)
