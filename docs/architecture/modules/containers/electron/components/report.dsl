group "[IPC] report" {
    reportDashboard = component "report:dashboard" "electron/ipc/report/route.ts" "KPI dashboard"
    reportSales = component "report:sales" "electron/ipc/report/route.ts" "Laporan penjualan"
    reportStock = component "report:stock" "electron/ipc/report/route.ts" "Laporan stok"
    reportFinance = component "report:finance" "electron/ipc/report/route.ts" "Laporan COGS/profit"
    reportExportFile = component "report:export" "electron/ipc/report/route.ts" "Generate PDF/Excel"
    reportService = component "reportService" "electron/ipc/report/service.ts" "aggregateKPIs, salesReport, exportData"
    reportRepo = component "reportRepo" "electron/ipc/report/repo.ts" "aggregateSales, financeSummary"
}
