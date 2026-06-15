component reactApp "DashboardPage" {
    title "[C3] - DashboardPage"
    include dashboardPage loadKPIs loadChart reportExport reportStore reportDashboard
    autoLayout
}

component reactApp "SalesReportPage" {
    title "[C3] - SalesReportPage"
    include salesReportPage loadChart reportExport reportStore reportSales reportExportFile
    autoLayout
}

component reactApp "StockReportPage" {
    title "[C3] - StockReportPage"
    include stockReportPage loadStockReport reportExport reportStock reportExportFile
    autoLayout
}

component reactApp "FinanceReportPage" {
    title "[C3] - FinanceReportPage"
    include financeReportPage loadFinanceReport reportExport reportFinance reportExportFile
    autoLayout
}
