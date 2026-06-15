dynamic reactApp "ManajemenStok" {
    title "[Flow] - Manajemen Stok"
    autoLayout

    admin -> inventoryPage "1. Buka halaman inventory"
    admin -> stockInForm "2. Stok masuk (pembelian)"
    stockInForm -> processStockIn "3. Proses stok masuk"
    processStockIn -> inventoryStockIn "4. IPC: inventory:stockIn"
    inventoryStockIn -> inventoryService "5. Insert stock log"
    inventoryService -> inventoryRepo "6. Query insert log"
    inventoryService -> productRepo "7. Update stok produk"
    admin -> adjustmentForm "8. Adjustment/koreksi stok"
    adjustmentForm -> adjustStock "9. Proses koreksi"
    adjustStock -> inventoryAdjust "10. IPC: inventory:adjust"
    admin -> stockLogTable "11. Lihat audit trail"
    stockLogTable -> queryLogs "12. Query log"
    queryLogs -> inventoryLogs "13. IPC: inventory:logs"
}
