kasir = person "Kasir" "Operator yang melayani transaksi penjualan"
pemilik = person "Pemilik Toko" "Melihat laporan dan mengelola data master"
admin = person "Admin" "Mengelola produk, inventory, customer, dan pengaturan sistem"

printer = softwareSystem "Thermal Printer" "Mencetak struk belanja via ESC/POS" {
    tags "External"
}
scanner = softwareSystem "Barcode Scanner" "Memindai barcode produk (USB/HID)" {
    tags "External"
}
laci = softwareSystem "Cash Drawer" "Menyimpan uang kas, terbuka via ESC/POS" {
    tags "External"
}
