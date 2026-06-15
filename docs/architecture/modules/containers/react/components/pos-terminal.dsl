group "[Page] POSTerminal" {
    posPage = component "POSTerminalPage" "pages/POSTerminalPage.tsx" "Halaman utama transaksi kasir 3 panel"
    productTable = component "ProductTable" "components/ProductTable.tsx" "Cari & pilih produk + qty dialog"
    cartPanel = component "CartPanel" "components/CartPanel.tsx" "Keranjang belanja, subtotal"
    holdBillModal = component "HoldBillModal" "components/HoldBillModal.tsx" "Simpan/muat transaksi ditahan"
    useBarcode = component "useBarcode" "hooks/useBarcode.ts" "Input barcode scanner via keyboard"
    useKeyboardShortcuts = component "useKeyboardShortcuts" "hooks/useKeyboardShortcuts.ts" "Shortcut keyboard global"
    handleBarcode = component "handleBarcode" "pos/barcode.ts" "Process scan + lookup produk"
    calculateCart = component "calculateCart" "pos/cart.ts" "Hitung subtotal, tax, total"
    selectCustomer = component "selectCustomer" "pos/customer.ts" "Pilih customer untuk transaksi"
    holdBill = component "holdBill" "pos/holdBill.ts" "Simpan/muat transaksi ditahan"
}
