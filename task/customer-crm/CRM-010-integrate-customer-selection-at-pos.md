# [CRM-010] Integrate Customer Selection at POS

**Module**: Customer CRM
**Priority**: P1
**Complexity**: S
**Spec Reference**: customer-crm-spec.md Section 8

## Description
Integrasi CustomerSearch di POS Terminal. Saat customer dipilih: tampilkan tier di header, apply multiplier poin, tombol redeem di PaymentModal, update poin setelah transaksi.

## Acceptance Criteria
- [ ] CustomerSearch muncul di header POS
- [ ] Tier customer ditampilkan di header setelah dipilih
- [ ] Poin di-calculate dengan multiplier tier saat transaksi
- [ ] Tombol "Redeem Points" muncul di PaymentModal
- [ ] Poin bertambah setelah transaksi sukses

## Dependencies
- [CRM-006]
- [POS-005]
- [POS-009]
