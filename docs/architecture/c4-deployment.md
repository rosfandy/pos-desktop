workspace "POS Desktop" "Aplikasi kasir offline-first berbasis Electron untuk UMKM dan retail kecil" {

    model {
        // ── End-user's machine node ───────────────────────────────────────────────
        device = deploymentNode "End-User Machine" "Windows 10+ / macOS 10.15+ / Ubuntu 18.04+" "Laptop atau desktop kasir toko retail" {
            tags "Infrastructure:Device"
        }

        os = deploymentNode device "Operating System" "Win32 / Darwin / Linux" "Sistem operasi host" {
            tags "Infrastructure:OS"
        }

        // ── POS Desktop App node ──────────────────────────────────────────────────
        electronApp = deploymentNode os "POS Desktop App" "Electron 30+" "Aplikasi yang diinstal via .exe / .dmg / .AppImage" {
            tags "Infrastructure:App"
        }

        // ── Chromium Renderer node ────────────────────────────────────────────────
        chromium = deploymentNode electronApp "Chromium Renderer" "Chromium (embedded)" "Jendela aplikasi — memuat SPA React" {
            tags "Process:Renderer"
        }

        spa = container chromium "React SPA" "React 18" "Antarmuka kasir, manajemen produk, laporan" {
            tags "Frontend:SPA"
        }
        zustand = container chromium "Zustand" "v5" "State management di memori renderer" {
            tags "Frontend:State"
        }
        ui = container chromium "shadcn/ui" "React + Tailwind" "Komponen UI" {
            tags "Frontend:UI"
        }

        // ── Node.js Main Process node ─────────────────────────────────────────────
        nodeMain = deploymentNode electronApp "Node.js Main Process" "Node.js 20+ (Electron)" "Proses utama — lifecycle, IPC, native APIs" {
            tags "Process:Main"
        }

        ipcBridge = container nodeMain "IPC Bridge" "Electron IPC" "contextBridge — whitelist channel" {
            tags "Main:IPC"
        }
        authSvc = container nodeMain "Auth Service" "TS + Drizzle" "Autentikasi & RBAC" {
            tags "Main:Service:Auth"
        }
        txSvc = container nodeMain "Transaction Service" "TS + Drizzle" "Pipeline transaksi penjualan" {
            tags "Main:Service:Transaction"
        }
        productSvc = container nodeMain "Product Service" "TS + Drizzle" "Manajemen produk & inventori" {
            tags "Main:Service:Product"
        }
        inventorySvc = container nodeMain "Inventory Service" "TS + Drizzle" "Tracking stok masuk/keluar" {
            tags "Main:Service:Inventory"
        }
        customerSvc = container nodeMain "Customer Service" "TS + Drizzle" "CRM & loyalty poin" {
            tags "Main:Service:Customer"
        }
        shiftSvc = container nodeMain "Shift Service" "TS + Drizzle" "Manajemen shift kasir" {
            tags "Main:Service:Shift"
        }
        reportSvc = container nodeMain "Report Service" "TS + Drizzle" "Agregasi & export laporan" {
            tags "Main:Service:Report"
        }
        printerSvc = container nodeMain "Printer Service" "TS + escpos" "Cetak struk & open drawer" {
            tags "Main:Service:Printer"
        }
        backupSvc = container nodeMain "Backup Service" "TS + fs" "Backup & restore database" {
            tags "Main:Service:Backup"
        }
        settingsSvc = container nodeMain "Settings Service" "TS + Drizzle" "Key-value store pengaturan toko" {
            tags "Main:Service:Settings"
        }
        updaterSvc = container nodeMain "Auto-Updater" "electron-updater" "Update OTA dari GitHub Releases" {
            tags "Main:Service:Updater"
        }

        // ── SQLite Database File node ────────────────────────────────────────────
        dbFile = deploymentNode electronApp "SQLite Database File" "better-sqlite3 (WAL mode)" "File pos-data.db di direktori userAppData" {
            tags "Database:Storage"
        }

        sqlite = database dbFile "SQLite DB" "Drizzle ORM" "12 tabel data operasional toko"

        // ── External Hardware nodes ───────────────────────────────────────────────
        printerHW = deploymentNode "Thermal Printer" "USB / LAN / Bluetooth" "Epson TM-T82, XPrinter XP-58/80, model kompatibel ESC/POS" {
            tags "Hardware:Printer"
        }
        escpos = container printerHW "ESC/POS Driver" "node-escpos" "Kirim perintah cetak dan trigger buka drawer" {
            tags "Hardware:Driver"
        }

        scannerHW = deploymentNode "Barcode Scanner" "USB HID" "Plug & play — keyboard emulation" {
            tags "Hardware:Scanner"
        }
        drawerHW = deploymentNode "Cash Drawer" "RJ11/RJ12" "Terhubung ke thermal printer" {
            tags "Hardware:Drawer"
        }

        // ── External Services nodes ───────────────────────────────────────────────
        github = deploymentNode "GitHub Releases" "HTTPS" "Repo rilis — cek & download update OTA" {
            tags "External:GitHub"
        }
        topupSvc = deploymentNode "KlikMBC Service" "HTTPS" "Layanan top-up pulsa (iframe di halaman /topup)" {
            tags "External:Service"
        }

        // ── Relationships: SPA → IPC Bridge ──────────────────────────────────────
        spa -> ipcBridge "IPC invoke (window.api.*)" "contextBridge / IPC"

        // ── Relationships: IPC Bridge → Services ─────────────────────────────────
        ipcBridge -> authSvc "auth:* channel"
        ipcBridge -> txSvc "transaction:* channel"
        ipcBridge -> productSvc "product:* channel"
        ipcBridge -> inventorySvc "inventory:* channel"
        ipcBridge -> customerSvc "customer:* channel"
        ipcBridge -> shiftSvc "shift:* channel"
        ipcBridge -> reportSvc "report:* channel"
        ipcBridge -> printerSvc "printer:* channel"
        ipcBridge -> backupSvc "backup:* channel"
        ipcBridge -> settingsSvc "settings:* channel"
        ipcBridge -> updaterSvc "updater:* channel"

        // ── Relationships: Services → Database ───────────────────────────────────
        authSvc -> sqlite "Query / update"
        txSvc -> sqlite "Query / insert"
        productSvc -> sqlite "Query / insert / update"
        inventorySvc -> sqlite "Query / insert"
        customerSvc -> sqlite "Query / insert / update"
        shiftSvc -> sqlite "Query / insert / update"
        reportSvc -> sqlite "Read-only agregasi"
        settingsSvc -> sqlite "Read / write key-value"
        backupSvc -> sqlite "VACUUM INTO + file copy"

        // ── Relationships: Printer → Hardware ────────────────────────────────────
        printerSvc -> escpos "Kirim perintah ESC/POS" "USB / LAN"
        escpos -> drawerHW "Trigger pembukaan" "RJ11 pulse"

        // ── Relationships: External ───────────────────────────────────────────────
        scannerHW -> spa "Input barcode sebagai keyboard" "USB HID"
        updaterSvc -> github "Cek rilis & download patch" "HTTPS"
        spa -> topupSvc "Muat iframe layanan top-up" "HTTPS"
    }

    views {
        // ── Deployment Diagram ──────────────────────────────────────────────────
        deployment electronApp "Deployment" {
            include *
            autoLayout lr 250
        }

        // ── Styles ──────────────────────────────────────────────────────────────
        styles {
            element "Infrastructure" {
                shape "RoundedBox"
                background #08427b
                color #ffffff
            }
            element "Process" {
                background #647687
                color #ffffff
            }
            element "Frontend" {
                background #85bbf0
                color #000000
            }
            element "Main" {
                background #438dd5
                color #ffffff
            }
            element "Database" {
                shape Cylinder
                background #85bbf0
                color #000000
            }
            element "Hardware" {
                shape "RoundedBox"
                background #647687
                color #ffffff
            }
            element "External" {
                shape "RoundedBox"
                background #999999
                color #ffffff
            }
        }
    }

    theme default
}
