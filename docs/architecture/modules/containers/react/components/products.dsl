group "[Page] Products" {
    productsPage = component "ProductsPage" "pages/ProductsPage.tsx" "List, search, filter produk"
    productForm = component "ProductForm" "components/ProductForm.tsx" "Create/edit produk + multi-unit"
    categoryTree = component "CategoryTree" "components/CategoryTree.tsx" "Tree kategori dengan CRUD"
    bulkImport = component "BulkImport" "components/BulkImport.tsx" "Import CSV/Excel + preview"
    productCard = component "ProductCard" "components/ProductCard.tsx" "Card view + thumbnail"
    searchProducts = component "searchProducts" "hooks/useProductSearch.ts" "Debounce search produk"
    saveProduct = component "saveProduct" "api/products.ts" "Create/update produk"
    manageCategories = component "manageCategories" "api/categories.ts" "CRUD kategori"
    importBulk = component "importBulk" "api/bulkImport.ts" "Parse & import CSV/Excel"
}
