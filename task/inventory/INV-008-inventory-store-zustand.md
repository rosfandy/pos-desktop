# [INV-008] Inventory Store (Zustand)

**Module**: Inventory
**Priority**: P0
**Complexity**: S
**Spec Reference**: inventory-spec.md Section 6

## Description
Zustand store untuk state inventory: logs, lowStockProducts, loading. Actions: fetchLogs, stockIn, stockOut, adjustStock, checkLowStock, getStockMovement.

## Acceptance Criteria
- [ ] `fetchLogs` memuat log dari IPC dengan filter
- [ ] CRUD actions memanggil IPC dan refresh list
- [ ] `checkLowStock` memanggil product service untuk cek stok rendah
- [ ] `getStockMovement` mengambil log per produk per periode

## Dependencies
- [INV-002]
- [INV-007]
