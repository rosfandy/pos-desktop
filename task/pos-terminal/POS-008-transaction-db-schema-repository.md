# [POS-008] Transaction DB Schema + Repository

**Module**: POS Terminal
**Priority**: P0
**Complexity**: M
**Spec Reference**: pos-terminal-spec.md Section 3

## Description
Definisi schema Drizzle untuk `transactions` dan `transaction_items`. Repo layer di main process untuk CRUD transaksi. Generate invoice number format `INV-YYYYMMDD-XXXX`.

## Acceptance Criteria
- [ ] Tabel `transactions` dan `transaction_items` terdefinisi di schema.ts
- [ ] Invoice number auto-generate dengan format yang benar
- [ ] Repo bisa create transaction dengan items (atomic insert)
- [ ] Repo bisa get transaction by id dengan joined items
- [ ] Repo bisa list transactions dengan filter (date range, status)

## Dependencies
- [CORE-003] (DB setup)
