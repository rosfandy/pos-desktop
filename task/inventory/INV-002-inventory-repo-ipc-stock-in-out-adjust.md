# [INV-002] Inventory Repo + IPC: Stock In, Out, Adjust

**Module**: Inventory
**Priority**: P0
**Complexity**: M
**Spec Reference**: inventory-spec.md Section 4

## Description
Repo layer untuk CRUD inventory logs. IPC handlers: `inventory:stockIn`, `inventory:stockOut`, `inventory:adjust`. Setiap operasi membuat log entry dan mengupdate stock di tabel products (via product repo integration atau direct SQL).

## Acceptance Criteria
- [ ] `inventory:stockIn` membuat log type 'in' dan menambah stock produk
- [ ] `inventory:stockOut` membuat log type 'out' dan mengurangi stock produk
- [ ] `inventory:adjust` membuat log type 'adjustment' dengan absolute quantity baru
- [ ] Semua operasi mencatat userId, reason, timestamp
- [ ] Validasi: stock tidak boleh negatif setelah stockOut (error INV_001)

## Dependencies
- [INV-001]
