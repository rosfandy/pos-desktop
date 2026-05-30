# [RPT-006] Report Store (Zustand)

**Module**: Reports & Analytics
**Priority**: P0
**Complexity**: S
**Spec Reference**: reports-analytics-spec.md Section 6

## Description
Zustand store untuk state laporan: dashboard, currentReport, loading, dateRange. Actions: fetchDashboard, fetchSalesReport, fetchStockReport, fetchFinanceReport, setDateRange, exportReport.

## Acceptance Criteria
- [ ] `fetchDashboard` memuat summary ke state
- [ ] `fetchSalesReport` memuat report data ke state
- [ ] `setDateRange` mengubah filter date range
- [ ] `exportReport` trigger export IPC
- [ ] Loading state untuk async actions

## Dependencies
- [RPT-002]
- [RPT-004]
