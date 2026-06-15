group "Reports" {
    dashboardPage = component "DashboardPage" "pages/DashboardPage.tsx" "KPI cards: today sales, transactions"
    salesReportPage = component "SalesReportPage" "pages/SalesReportPage.tsx" "Laporan penjualan + filter & chart"
    stockReportPage = component "StockReportPage" "pages/StockReportPage.tsx" "Laporan stok per produk"
    financeReportPage = component "FinanceReportPage" "pages/FinanceReportPage.tsx" "Laporan COGS, profit"
    reportExport = component "ExportButton" "components/ExportButton.tsx" "Export PDF/Excel"
    reportStore = component "reportStore" "stores/reportStore.ts" "State filter & data laporan"
    loadKPIs = component "loadKPIs" "api/reports.ts" "Query KPI cards"
    loadChart = component "loadChart" "api/reports.ts" "Query chart data"
    exportReport = component "exportReport" "api/export.ts" "Generate PDF/Excel"
    loadStockReport = component "loadStockReport" "api/reports.ts" "Query data laporan stok"
    loadFinanceReport = component "loadFinanceReport" "api/reports.ts" "Query data laporan keuangan"
}
