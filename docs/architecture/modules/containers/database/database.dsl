database = container "Database" "SQLite 3" "Persistent storage - better-sqlite3" {
    tags "Database"

    tableUsers = component "Table Users" "database/tables/users" "User account + PIN hash"
    tableProducts = component "Table Products" "database/tables/products" "Product catalog + barcode + stock"
    tableTransactions = component "Table Transactions" "database/tables/transactions" "Sales header"
    tableTransactionItems = component "Table TransactionItems" "database/tables/transaction_items" "Sales line items"
    tableInventoryLog = component "Table InventoryLog" "database/tables/inventory_log" "Stock movement audit"
    tableCustomers = component "Table Customers" "database/tables/customers" "Customer master + points + tier"
    tableShifts = component "Table Shifts" "database/tables/shifts" "Shift records"
}