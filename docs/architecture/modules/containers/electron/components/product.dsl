group "[IPC] product" {
    productList = component "product:list" "electron/ipc/product/route.ts" "Cari/list produk"
    productGetById = component "product:getById" "electron/ipc/product/route.ts" "Ambil produk by ID"
    productCreate = component "product:create" "electron/ipc/product/route.ts" "Tambah/update produk"
    productDelete = component "product:delete" "electron/ipc/product/route.ts" "Hapus produk"
    productBulkImport = component "product:bulkImport" "electron/ipc/product/route.ts" "Import massal CSV"
    productService = component "productService" "electron/ipc/product/service.ts" "listProducts, saveProduct, bulkImport"
    productRepo = component "productRepo" "electron/ipc/product/repo.ts" "queryProducts, insertProduct, updateStock"
}
