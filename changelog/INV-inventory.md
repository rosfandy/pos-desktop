# Changelog: Inventory Module

**Last Updated**: 2026-05-28
**Status**: ⬜ Not Started — 0/12 complete

---

## Overview

Modul Inventory belum mulai diimplementasi. Berikut rencana task yang akan diimplementasi:

| Kode | Deskripsi | Prioritas |
|------|-----------|-----------|
| INV-001 | DB Schema: inventory_logs table | P0 |
| INV-002 | Inventory Repo + IPC: stockIn, stockOut, adjust | P0 |
| INV-003 | Stock Calculation Service | P0 |
| INV-004 | StockInForm Component | P0 |
| INV-005 | StockOutForm Component | P0 |
| INV-006 | AdjustmentForm Component | P0 |
| INV-007 | InventoryLogTable Component | P0 |
| INV-008 | Inventory Store (Zustand) | P0 |
| INV-009 | Low Stock Alert Dashboard Integration | P1 |
| INV-010 | Multi-Location Warehouse Schema + Transfer | P1 |
| INV-011 | Stock Movement Report Per Product | P1 |
| INV-012 | Stock Valuation: FIFO / AVCO | P1 |

---

## Architecture Plan

### Database Schema

**`inventory_logs` table** (INV-001):
```
id              TEXT PRIMARY KEY
productId       TEXT NOT NULL REFERENCES products(id)
type            TEXT NOT NULL  -- 'in' | 'out' | 'adjustment' | 'sale' | 'return' | 'damage' | 'expired'
quantity        REAL NOT NULL
unit            TEXT NOT NULL DEFAULT 'pcs'
unitConversion  REAL NOT NULL DEFAULT 1
baseQuantity    REAL NOT NULL
costPrice       REAL               -- optional, for COGS tracking
locationId      TEXT               -- optional, for multi-location (INV-010)
referenceType   TEXT               -- e.g. 'transaction', 'adjustment', 'transfer'
referenceId     TEXT               -- foreign key to source record
userId          TEXT NOT NULL REFERENCES users(id)
reason          TEXT
notes           TEXT
createdAt       INTEGER NOT NULL
```

**`locations` table** (INV-010 — P1):
```
id              TEXT PRIMARY KEY
name            TEXT NOT NULL
type            TEXT NOT NULL  -- 'store' | 'warehouse' | 'kitchen'
address         TEXT
isActive        INTEGER NOT NULL DEFAULT 1
createdAt       INTEGER NOT NULL
```

### IPC Channels (INV-002)

```
inventory:stockIn    →  create log type 'in'  + update product stock
inventory:stockOut   →  create log type 'out' + update product stock (validate not negative)
inventory:adjust     →  create log type 'adjustment' (absolute qty)
inventory:transfer   →  create 2 logs (out from A, in to B) [INV-010, P1]
inventory:logs       →  fetch inventory logs with filters
inventory:movement   →  get stock movement per product per period [INV-011, P1]
```

### Stock Calculation Logic (INV-003)

```
currentStock = Σ (all logs for product)
  in  / return       → +baseQuantity
  out / sale / damage / expired → -baseQuantity
  adjustment         → +newQty - oldQty  (absolute change)
```

### FIFO / AVCO Valuation (INV-012, P1)

- **FIFO**: Cost dari batch stok tertua pertama keluar
- **AVCO**: Rata-rata berbobot dari semua batch masuk

---

## Implementation Order

1. **INV-001** — DB schema (foundation)
2. **INV-002** — Repo + IPC (core logic)
3. **INV-003** — Calculation service (business logic)
4. **INV-004~006** — Forms (UI layer, depends on INV-002)
5. **INV-007** — Log table (UI layer, depends on INV-002)
6. **INV-008** — Zustand store (state, depends on INV-002/007)
7. **INV-009** — Low stock alert (integration, depends on INV-008)
8. **INV-010** — Multi-location (P1, depends on INV-002)
9. **INV-011** — Stock movement report (P1, depends on INV-008)
10. **INV-012** — FIFO/AVCO valuation (P1, depends on INV-002/003)

---

## Notes

- Semua task belum mulai — progress file ini akan di-update saat implementasi dimulai
- INV-001 adalah foundation untuk semua task lain
- INV-010 (multi-location) adalah P1, bisa ditunda sampai P0 selesai
- INV-012 (FIFO/AVCO) adalah P1 dengan kompleksitas L, membutuhkan test ekstensif
