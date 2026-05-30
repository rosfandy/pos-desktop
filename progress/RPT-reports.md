# Progress: Reports & Analytics (RPT)

**Started**: 2026-05-30
**Last Updated**: 2026-05-30

## Summary
- Total items: 10
- Completed: 9
- In Progress: 0
- Blocked: 0

## Checklist Progress

### Backend Layer
- [x] `electron/services/report/service.ts` — aggregasi SQL: sales, stock, finance ✓ 2026-05-30
  - `getSalesReport()` — summary, byDay, byProduct, byCategory, byPayment, byCashier
  - `getStockReport()` — semua produk aktif + nilai stok
  - `getFinanceReport()` — revenue, diskon, pajak, net, byDay
- [x] `electron/ipc/report.ts` — IPC handlers: `report:sales`, `report:stock`, `report:finance` ✓ 2026-05-30
- [x] `electron/main.ts` — register `registerReportHandlers()` ✓ 2026-05-30
- [x] `electron/preload.ts` — whitelist channels: `reportSales`, `reportStock`, `reportFinance` ✓ 2026-05-30

### Frontend Types
- [x] `src/lib/api.ts` — tambah types: `ReportParams`, `SalesReport`, `StockReport`, `FinanceReport`, dan turunannya ✓ 2026-05-30
- [x] `SalesSummary` — tambah `totalCogs`, `totalProfit` ✓ 2026-05-30

### Backend — Profit/COGS
- [x] `electron/services/report/service.ts` — query COGS dari `transaction_items JOIN products` ✓ 2026-05-30
- [x] Hitung `totalProfit = totalRevenue - totalDiscount - totalCogs` ✓ 2026-05-30

### Frontend Page
- [x] `src/pages/ReportsPage.tsx` — halaman laporan utama ✓ 2026-05-30
  - **Tab Penjualan**: omzet (revenue) + untung/rugi (profit) cards, chart ApexCharts
  - **Tab Stok**: tabel stok + search filter
  - **Tab Keuangan**: summary cards + chart ApexCharts
- [x] `src/App.tsx` — ganti `PlaceholderPage` di route `/reports` dengan `ReportsPage` ✓ 2026-05-30

### ApexCharts Migration
- [x] Install `apexcharts` + `react-apexcharts` ✓ 2026-05-30
- [x] Ganti BarChart komponen CSS dengan ApexCharts di tab Penjualan & Keuangan ✓ 2026-05-30
- [x] Hapus `src/components/ui/bar-chart.tsx` (tidak dipakai) ✓ 2026-05-30

### Integration
- [ ] Typecheck pass — pre-existing error di `HoldBillModal.tsx` (tidak terkait)
- [ ] Manual smoke test: load each tab, verify data matches DB

## Blockers
_Tidak ada_

## Next Steps
1. Fix pre-existing TS error di `POSTerminalPage.tsx` (line 250: `holdBill` 0 argumen)
2. Fix pre-existing TS error di `HoldBillModal.tsx` (block-scoped `open`)
3. Smoke test report tabs (Penjualan, Stok, Keuangan) dengan data real
4. QA pada inventory forms (StockIn, StockOut, Adjustment, Transfer)

## Notes
- ApexCharts menggantikan recharts (yang sudah di-uninstall sebelumnya) dan CSS BarChart — zero-dependency chart library
- Profit dihitung dari: `totalRevenue - totalDiscount - totalCogs` (COGS dari `quantity * price_buy` di `transaction_items JOIN products`)
- Jika `price_buy` belum diisi di produk, COGS = 0 sehingga profit = revenue - discount
- Default date range: hari ini (untuk tab Penjualan & Keuangan)
- Tab Stok tidak butuh date range — snapshot current stock
