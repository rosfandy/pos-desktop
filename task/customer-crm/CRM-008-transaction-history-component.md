# [CRM-008] TransactionHistory Component

**Module**: Customer CRM
**Priority**: P1
**Complexity**: S
**Spec Reference**: customer-crm-spec.md Section 7

## Description
Daftar riwayat transaksi pelanggan. Integrasi dengan transaction repo untuk get transactions by customerId.

## Acceptance Criteria
- [ ] Tabel transaksi pelanggan: tanggal, invoice, total, metode bayar
- [ ] Total spending calculation dari riwayat
- [ ] Filter by date range
- [ ] Pagination

## Dependencies
- [CRM-002]
- [POS-008] (transaction repo)
