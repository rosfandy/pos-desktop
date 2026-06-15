group "[IPC] customer" {
    customerList = component "customer:list" "electron/ipc/customer/route.ts" "Cari/list customer"
    customerCreate = component "customer:create" "electron/ipc/customer/route.ts" "Tambah/update customer"
    customerGetPoints = component "customer:getPoints" "electron/ipc/customer/route.ts" "Ambil poin & tier"
    customerService = component "customerService" "electron/ipc/customer/service.ts" "listCustomers, saveCustomer, getPoints"
    customerRepo = component "customerRepo" "electron/ipc/customer/repo.ts" "queryCustomers, insertCustomer, updatePoints"
}
