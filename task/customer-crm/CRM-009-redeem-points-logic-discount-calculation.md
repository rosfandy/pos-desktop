# [CRM-009] Redeem Points Logic & Discount Calculation

**Module**: Customer CRM
**Priority**: P1
**Complexity**: S
**Spec Reference**: customer-crm-spec.md Section 4, Section 5

## Description
Logika redeem poin: konversi poin ke diskon (misal: 100 poin = Rp 1.000). Update points balance setelah redeem. IPC: `customer:redeemPoints`.

## Acceptance Criteria
- [ ] 1 poin = Rp 100 (atau sesuai setting)
- [ ] `redeemPoints` mengurangi poin pelanggan dan return nilai diskon
- [ ] Error CUST_002 jika poin tidak cukup
- [ ] Riwayat redeem tercatat (opsional, bisa P2)

## Dependencies
- [CRM-003]
