workspace "POS Desktop" "Aplikasi kasir offline-first berbasis Electron untuk UMKM dan retail kecil" {

    model {
        // ── People ────────────────────────────────────────────────────────────────
        cashier = person "Kasir / Pengguna" "Melakukan transaksi penjualan, mengelola produk, dan melihat laporan" {
            tags "Role:Kasir"
        }
        manager = person "Manager / Admin" "Mengelola user, pengaturan toko, dan melihat laporan lengkap" {
            tags "Role:Manager"
        }

        // ── Main System ──────────────────────────────────────────────────────────
        pos = softwareSystem "POS Desktop" "Aplikasi kasir offline-first berbasis Electron untuk UMKM dan retail kecil" {
            tags "System:POS"
        }

        // ── External Systems ─────────────────────────────────────────────────────
        printer = softwareSystem "Thermal Printer" "Mencetak struk dan membuka cash drawer (58mm/80mm)" {
            tags "Hardware:Printer"
        }
        scanner = softwareSystem "USB Barcode Scanner" "Memindai barcode produk secara otomatis" {
            tags "Hardware:Scanner"
        }
        drawer = softwareSystem "Cash Drawer" "Laci uang yang terbuka melalui trigger printer" {
            tags "Hardware:Drawer"
        }
        topup = softwareSystem "KlikMBC Top-up Service" "Layanan isi ulang pulsa / top-up (loaded via iframe)" {
            tags "External:Service"
        }

        // ── Relationships ────────────────────────────────────────────────────────
        cashier -> pos "Melakukan transaksi, mengelola produk & inventori"
        manager -> pos "Mengelola pengguna, pengaturan toko, dan laporan"
        pos -> printer "Mencetak struk dan membuka laci uang" "ESC/POS via USB atau LAN"
        pos -> scanner "Menerima input barcode" "USB HID Keyboard Emulation"
        pos -> drawer "Memicu pembukaan laci uang" "RJ11/RJ12 via printer"
        pos -> topup "Memuat layanan top-up di iframe" "HTTPS"
    }

    views {
        // ── System Context ──────────────────────────────────────────────────────
        systemContext pos "System Context" {
            include *
            autoLayout lr 250
        }

        // ── Styles ──────────────────────────────────────────────────────────────
        styles {
            element "Person" {
                shape Person
                background #08427b
                color #ffffff
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
            element "Hardware" {
                background #647687
                color #ffffff
            }
        }
    }

    theme default
}
