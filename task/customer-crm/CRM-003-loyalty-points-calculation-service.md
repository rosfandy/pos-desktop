# [CRM-003] Loyalty Points Calculation Service

**Module**: Customer CRM
**Priority**: P0
**Complexity**: S
**Spec Reference**: customer-crm-spec.md Section 5

## Description
Service untuk menghitung poin berdasarkan total belanja dan tier multiplier. Fungsi `calculatePoints(amount, tier)` dan `calculateTier(totalSpent)`.

## Acceptance Criteria
- [ ] Bronze: 1 poin per Rp 10.000
- [ ] Silver: 1.2x multiplier (min Rp 1jt)
- [ ] Gold: 1.5x multiplier (min Rp 5jt)
- [ ] Platinum: 2x multiplier (min Rp 10jt)
- [ ] `calculateTier` mengembalikan tier yang benar berdasarkan totalSpent
- [ ] Unit tests untuk semua tier thresholds

## Dependencies
- [CRM-001]
