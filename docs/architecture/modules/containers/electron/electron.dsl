electronMain = container "Electron Main Process" "Electron 28, Node.js" "IPC handler, printer, DB, window management" {
    tags "Container"

    mainEntry = component "main.ts" "electron/main.ts" "App ready, window creation, IPC init"
    preload = component "preload.ts" "electron/preload.ts" "contextBridge API whitelist"
    ipcHandlers = component "ipcHandlers" "electron/ipc/handlers.ts" "Channel registry for all modules"
    printerSvc = component "printerService" "electron/printer/service.ts" "ESC/POS buffer builder"
    cashDrawerSvc = component "cashDrawerService" "electron/printer/cashDrawer.ts" "Open laci via ESC/POS"
    settingsSvc = component "settingsService" "electron/database/settings.ts" "electron-store persistent config"
    receiptTpl = component "receiptTemplate" "electron/printer/templates/receipt.html" "Print layout thermal 80mm"

    group "Foundation" {
        dbService = component "databaseService" "electron/database/service.ts" "better-sqlite3 wrapper + WAL mode"
        migrationRun = component "migrationRunner" "electron/database/migrations/runner.ts" "Schema migration versioning"
    }

    api = component "api" "electron/ipc/api.ts" "Channel registration & entry point"

    // IPC COMPONENTS
    !include components/auth.dsl
    !include components/pos.dsl
    !include components/product.dsl
    !include components/inventory.dsl
    !include components/customer.dsl
    !include components/report.dsl
    !include components/shift.dsl
    !include components/settings.dsl
    !include components/printer.dsl
}