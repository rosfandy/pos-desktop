component electronMain "inventory" {
    title "[C3] - IPC inventory"
    include inventoryStockIn inventoryStockOut inventoryAdjust inventoryLogs inventoryService inventoryRepo productRepo tableInventoryLog
    autoLayout lr
}
