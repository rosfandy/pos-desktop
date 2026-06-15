group "[IPC] pos" {
    posSaveTransaction = component "pos:saveTransaction" "electron/ipc/pos/route.ts" "Simpan transaksi + kurangi stock"
    posHold = component "pos:hold" "electron/ipc/pos/route.ts" "Tahan transaksi"
    posRelease = component "pos:release" "electron/ipc/pos/route.ts" "Lepas transaksi ditahan"
    posService = component "posService" "electron/ipc/pos/service.ts" "saveTransaction, holdBill, releaseBill"
    salesRepo = component "salesRepo" "electron/ipc/pos/repo.ts" "insertTransaction, queryItems"
}
