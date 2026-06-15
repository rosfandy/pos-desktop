dynamic reactApp "ManajemenProduk" {
    title "[Flow] - Manajemen Produk"
    autoLayout

    admin -> productsPage "1. Buka halaman produk"
    admin -> productForm "2. Tambah produk baru"
    productForm -> saveProduct "3. Simpan produk"
    saveProduct -> productCreate "4. IPC: product:create"
    productCreate -> productService "5. Insert/update product"
    productService -> productRepo "6. Query insert"
    admin -> categoryTree "7. Atur kategori"
    categoryTree -> manageCategories "8. CRUD kategori"
    admin -> bulkImport "9. Import massal CSV"
    bulkImport -> importBulk "10. Parse & import"
    importBulk -> productBulkImport "11. IPC: product:bulkImport"
    productBulkImport -> productService "12. Bulk insert"
    productService -> productRepo "13. Query batch insert"
}
