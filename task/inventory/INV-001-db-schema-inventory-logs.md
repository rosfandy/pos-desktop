# [INV-001] DB Schema: Inventory_Logs Table

**Module**: Inventory
**Priority**: P0
**Complexity**: S
**Spec Reference**: inventory-spec.md Section 3

## Description
Definisi schema Drizzle untuk `inventory_logs` dengan tipe: 'in', 'out', 'adjustment', 'sale', 'return', 'damage', 'expired'. Relasi ke products dan users.

## Acceptance Criteria
- [ ] Schema inventory_logs terdefinisi lengkap
- [ ] Enum type sesuai spec (7 jenis)
- [ ] Index pada productId dan createdAt untuk query performance
- [ ] Default conversionFactor = 1

## Dependencies
- [CORE-003] (DB foundation)
- [PROD-001] (products table ideally, but can be created independently)
