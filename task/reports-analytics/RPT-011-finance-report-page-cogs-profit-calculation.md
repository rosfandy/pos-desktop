# [RPT-011] FinanceReportPage: COGS & Profit Calculation

**Module**: Reports & Analytics
**Priority**: P1
**Complexity**: M
**Spec Reference**: reports-analytics-spec.md Section 3

## Description
Halaman laporan keuangan: revenue, COGS (dari priceBuy * qty sold), gross profit, expenses (placeholder), net profit. Daily breakdown table dan chart.

## Acceptance Criteria
- [ ] Hitung revenue dari transactions dalam periode
- [ ] Hitung COGS dari transaction_items dengan priceBuy produk
- [ ] Gross profit = revenue - COGS
- [ ] Daily breakdown table: tanggal, revenue, COGS, profit
- [ ] Bar chart untuk daily profit trend

## Dependencies
- [RPT-001]
- [POS-008]
