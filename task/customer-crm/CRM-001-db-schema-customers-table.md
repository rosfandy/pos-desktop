# [CRM-001] DB Schema: Customers Table

**Module**: Customer CRM
**Priority**: P0
**Complexity**: S
**Spec Reference**: customer-crm-spec.md Section 3

## Description
Definisi schema Drizzle untuk tabel `customers` dengan field: id, name, phone (unique), email, address, points, tier, totalSpent, isActive, createdAt.

## Acceptance Criteria
- [ ] Schema customers terdefinisi lengkap
- [ ] Phone field unique constraint
- [ ] Tier enum: bronze, silver, gold, platinum
- [ ] Default points = 0, totalSpent = 0, tier = bronze
- [ ] Index pada phone dan name untuk search

## Dependencies
- [CORE-003] (DB foundation)
