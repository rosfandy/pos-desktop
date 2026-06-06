workspace "POS Desktop" "Aplikasi kasir offline-first berbasis Electron untuk UMKM dan retail kecil" {

    model {
        // ── People ────────────────────────────────────────────────────────────────
        cashier = person "Kasir" "Melakukan transaksi dan mengelola inventori" {
            tags "Role:Kasir"
        }
        manager = person "Manager / Admin" "Mengelola pengguna dan pengaturan" {
            tags "Role:Manager"
        }

        // ── System ────────────────────────────────────────────────────────────────
        pos = softwareSystem "POS Desktop Application" "Aplikasi kasir offline-first berbasis Electron" {
            tags "System:POS"
        }

        // ── Containers: Renderer Process ──────────────────────────────────────────
        renderer = container pos "Renderer Process" "Chromium" "Jendela aplikasi — memuat SPA React" {
            tags "Process:Renderer"
        }

        spa = container renderer "React SPA" "React 18 + TypeScript + Vite" "Single-page application dengan routing HashRouter" {
            tags "Frontend:SPA"
        }
        router = container renderer "React Router" "React Router v6" "Navigasi antar halaman: POS, Produk, Inventori, Pelanggan, Laporan, Shift, Pengaturan" {
            tags "Frontend:Router"
        }
        zustand = container renderer "Zustand State" "Zustand" "Manajemen state klien: auth, cart, produk, pengaturan, tema" {
            tags "Frontend:State"
        }
        ui = container renderer "UI Component Library" "shadcn/ui + Tailwind CSS" "Komponen antarmuka: Button, Dialog, Table, Toast, dll." {
            tags "Frontend:UI"
        }
        hw = container renderer "Hardware Hooks" "Custom React Hooks" "useBarcode, usePrinter, useKeyboardShortcuts — hardware bridge" {
            tags "Frontend:Hooks"
        }

        // ── Containers: Main Process ──────────────────────────────────────────────
        main = container pos "Main Process" "Node.js 20+ (Electron)" "Proses utama — lifecycle, IPC, native APIs" {
            tags "Process:Main"
        }

        ipcBridge = container main "IPC Bridge" "Electron IPC + preload.ts" "Menyaring dan meneruskan channel IPC dari renderer ke handler" {
            tags "Main:IPC"
        }
        authService = container main "Auth Service" "TypeScript + Drizzle ORM" "Login PIN/password, sesi, RBAC admin/manager/kasir" {
            tags "Main:Service:Auth"
        }
        transactionService = container main "Transaction Service" "TypeScript + Drizzle ORM" "CRUD transaksi, hold/void/refund, validasi stok" {
            tags "Main:Service:Transaction"
        }
        productService = container main "Product Service" "TypeScript + Drizzle ORM" "CRUD produk, kategori, unit konversi, bulk import/export" {
            tags "Main:Service:Product"
        }
        inventoryService = container main "Inventory Service" "TypeScript + Drizzle ORM" "Stock in/out/adjustment, tracking lokasi gudang" {
            tags "Main:Service:Inventory"
        }
        customerService = container main "Customer Service" "TypeScript + Drizzle ORM" "CRM dasar, membership poin, riwayat transaksi" {
            tags "Main:Service:Customer"
        }
        shiftService = container main "Shift Service" "TypeScript + Drizzle ORM" "Buka/tutup shift kasir, rekap modal & penjualan" {
            tags "Main:Service:Shift"
        }
        reportService = container main "Report Service" "TypeScript + Drizzle ORM" "Laporan penjualan, stok, keuangan, export PDF/Excel" {
            tags "Main:Service:Report"
        }
        printerService = container main "Printer Service" "TypeScript + escpos" "Cetak struk thermal, open cash drawer, antrian cetak" {
            tags "Main:Service:Printer"
        }
        backupService = container main "Backup Service" "TypeScript + fs" "Backup & restore database SQLite ke file .db" {
            tags "Main:Service:Backup"
        }
        settingsService = container main "Settings Service" "TypeScript + Drizzle ORM" "Pengaturan toko, pajak, printer, tema, receipt template" {
            tags "Main:Service:Settings"
        }
        updaterService = container main "Auto-Updater Service" "electron-updater" "Cek, download, dan install update aplikasi OTA" {
            tags "Main:Service:Updater"
        }

        // ── Container: Database ───────────────────────────────────────────────────
        sqlite = container pos "SQLite Database" "better-sqlite3 + Drizzle ORM" "Database lokal: users, products, transactions, inventory_logs, shifts, dll." {
            tags "Database:SQLite"
        }

        // ── External Services ────────────────────────────────────────────────────
        topupIframe = softwareSystem "KlikMBC Top-up" "Layanan top-up pulsa — hanya di halaman /topup. Dihost di domain klikmbc.biz" {
            tags "External:Service"
        }
        githubReleases = softwareSystem "GitHub Releases" "Sumber update OTA — repositori GitHub untuk rilis versi baru" {
            tags "External:Service"
        }

        // ── Relationships: Users → Renderer ──────────────────────────────────────
        cashier -> spa "Berinteraksi via UI"
        manager -> spa "Berinteraksi via UI"

        // ── Relationships: Renderer internal ─────────────────────────────────────
        spa -> router "Melakukan navigasi"
        spa -> zustand "Membaca / menulis state"
        spa -> ui "Merender komponen"
        spa -> hw "Menggunakan hook perangkat keras"

        hw -> ipcBridge "Memanggil via exposed API" "contextBridge / IPC invoke"
        zustand -> ipcBridge "Memanggil API via window.api" "IPC invoke"

        // ── Relationships: IPC Bridge → Services ─────────────────────────────────
        ipcBridge -> authService "Meneruskan auth:* channel"
        ipcBridge -> transactionService "Meneruskan transaction:* channel"
        ipcBridge -> productService "Meneruskan product:* channel"
        ipcBridge -> inventoryService "Meneruskan inventory:* channel"
        ipcBridge -> customerService "Meneruskan customer:* channel"
        ipcBridge -> shiftService "Meneruskan shift:* channel"
        ipcBridge -> reportService "Meneruskan report:* channel"
        ipcBridge -> printerService "Meneruskan printer:* channel"
        ipcBridge -> backupService "Meneruskan backup:* channel"
        ipcBridge -> settingsService "Meneruskan settings:* channel"
        ipcBridge -> updaterService "Meneruskan updater:* channel"

        // ── Relationships: Services → Database ───────────────────────────────────
        authService -> sqlite "Query users table" "Drizzle ORM / SQL"
        transactionService -> sqlite "Query transactions & transaction_items" "Drizzle ORM / SQL"
        transactionService -> productService "Cek stok sebelum transaksi"
        productService -> sqlite "Query products & categories & product_units" "Drizzle ORM / SQL"
        inventoryService -> sqlite "Query inventory_logs & locations" "Drizzle ORM / SQL"
        customerService -> sqlite "Query customers" "Drizzle ORM / SQL"
        shiftService -> sqlite "Query shifts" "Drizzle ORM / SQL"
        reportService -> sqlite "Query transactions & inventory_logs untuk agregasi" "Drizzle ORM / SQL"
        settingsService -> sqlite "Query & update settings key-value" "Drizzle ORM / SQL"
        backupService -> sqlite "Backup & restore seluruh database" "File copy + VACUUM"
        printerService -> printer "Kirim perintah cetak ESC/POS" "USB / LAN"
        updaterService -> githubReleases "Cek & download update" "HTTPS (electron-updater)"

        // ── Relationships: SPA → External ────────────────────────────────────────
        spa -> topupIframe "Memuat layanan top-up di iframe" "HTTPS"
    }

    views {
        // ── Container Diagram ────────────────────────────────────────────────────
        container pos "Containers" {
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
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "Database" {
                shape Cylinder
                background #438dd5
                color #ffffff
            }
            element "Hardware" {
                shape "RoundedBox"
                background #647687
                color #ffffff
            }
        }
    }

    theme default
}
