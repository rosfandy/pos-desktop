dynamic reactApp "LaporanAnalitik" {
    title "[Flow] - Laporan & Analitik"
    autoLayout

    pemilik -> dashboardPage "1. Buka dashboard"
    dashboardPage -> loadKPIs "2. Load KPI"
    loadKPIs -> reportDashboard "3. IPC: report:dashboard"
    reportDashboard -> reportService "4. Aggregate queries"
    reportService -> reportRepo "5. Query aggregate"
    pemilik -> salesReportPage "6. Laporan penjualan"
    salesReportPage -> loadChart "7. Load chart"
    loadChart -> reportSales "8. IPC: report:sales"
    salesReportPage -> reportExport "9. Export PDF"
    reportExport -> exportReport "10. Generate"
    exportReport -> reportExportFile "11. IPC: report:export"
}
