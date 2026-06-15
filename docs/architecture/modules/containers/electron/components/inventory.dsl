group "[IPC] inventory" {
    inventoryStockIn = component "inventory:stockIn" "electron/ipc/inventory/route.ts" "Catat stok masuk"
    inventoryStockOut = component "inventory:stockOut" "electron/ipc/inventory/route.ts" "Catat stok keluar"
    inventoryAdjust = component "inventory:adjust" "electron/ipc/inventory/route.ts" "Adjust/koreksi stok"
    inventoryLogs = component "inventory:logs" "electron/ipc/inventory/route.ts" "Query log stok"
    inventoryService = component "inventoryService" "electron/ipc/inventory/service.ts" "stockIn, stockOut, adjustStock, queryLogs"
    inventoryRepo = component "inventoryRepo" "electron/ipc/inventory/repo.ts" "insertLog, queryInventoryLogs, updateInvStock"
}
