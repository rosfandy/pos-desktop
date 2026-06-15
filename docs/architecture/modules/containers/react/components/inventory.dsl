group "[Page] Inventory" {
    inventoryPage = component "InventoryPage" "pages/InventoryPage.tsx" "Halaman utama manajemen stok"
    stockInForm = component "StockInForm" "components/StockInForm.tsx" "Penerimaan stok barang"
    stockOutForm = component "StockOutForm" "components/StockOutForm.tsx" "Pengeluaran stok non-penjualan"
    adjustmentForm = component "AdjustmentForm" "components/AdjustmentForm.tsx" "Koreksi/damage/expired stock"
    stockLogTable = component "StockLogTable" "components/StockLogTable.tsx" "Audit trail pergerakan stok"
    lowStockAlert = component "LowStockAlert" "components/LowStockAlert.tsx" "Alert stok minimal dashboard"
    processStockIn = component "processStockIn" "api/inventory.ts" "Proses stok masuk"
    processStockOut = component "processStockOut" "api/inventory.ts" "Proses stok keluar"
    adjustStock = component "adjustStock" "api/inventory.ts" "Koreksi/damage/expired"
    queryLogs = component "queryLogs" "api/inventory.ts" "Query audit trail"
}
