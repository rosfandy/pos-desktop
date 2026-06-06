workspace "POS Desktop" "Aplikasi kasir offline-first berbasis Electron untuk UMKM dan retail kecil" {

    model {
        // ── Parent Containers ─────────────────────────────────────────────────────
        renderer = softwareSystem "React SPA" "React 18 + TypeScript" "Antarmuka kasir, manajemen produk, laporan"
        ipc = container "IPC Bridge" "contextBridge / preload.ts" "Antarmuka IPC yang diekspos ke renderer"
        txModule = softwareSystem "Transaction Service Module" "Main process transaction pipeline"
        zustandLayer = softwareSystem "Zustand State Layer" "React renderer state management"

        // ══════════════════════════════════════════════════════════════════════════
        // 3.1 POS Terminal — Modul Transaksi
        // ══════════════════════════════════════════════════════════════════════════
        posPage = component renderer "POSTerminalPage" "React Page" "Halaman kasir utama — layout kiri (kategori/produk) dan kanan (cart)"
        cartPanel = component renderer "CartPanel" "React Component" "Daftar item di keranjang, hitung subtotal/diskon/pajak/total"
        paymentModal = component renderer "PaymentModal" "React Component / Dialog" "Pilih metode pembayaran, masukkan jumlah bayar, hitung kembalian"
        receiptPreview = component renderer "ReceiptPreview" "React Component" "Preview struk sebelum cetak"
        voidRefundModal = component renderer "VoidRefundModal" "React Component / Dialog" "Alasan void/refund transaksi"
        holdBillModal = component renderer "HoldBillModal" "React Component / Dialog" "Simpan transaksi sementara"
        cashOutModal = component renderer "CashOutModal" "React Component / Dialog" "Keluar kas (cash out) selama shift"
        productGrid = component renderer "ProductGrid / ProductTable" "React Component" "Tampilan grid atau list produk, dengan filter kategori"
        barcodeInput = component renderer "Barcode Search Input" "React Component" "Input pencarian + scan barcode (USB HID)"
        useBarcode = component renderer "useBarcode Hook" "Custom Hook" "Mendeteksi input barcode dari USB scanner (timeout-based debounce)"
        useShortcuts = component renderer "useKeyboardShortcuts Hook" "Custom Hook" "F2=focus search, F4=payment, F5=hold, F6=unhold, F7=reprint, Esc=cancel"
        cartStore = component zustandLayer "cartStore" "Zustand Store" "State sementara keranjang: items[], subtotal, discount, tax, total, paymentMethod"

        // ══════════════════════════════════════════════════════════════════════════
        // 3.2 Transaction Service (Main Process)
        // ══════════════════════════════════════════════════════════════════════════
        txIpcHandler = component txModule "Transaction IPC Handler" "electron/ipc/transaction.ts" "registerTransactionHandlers() — daftar semua endpoint channel transaction:*"
        txService = component txModule "Transaction Service" "electron/services/transaction/service.ts" "Orkestrasi: validasi stok, hitung kembalian, panggil repo, publish event"
        txRepo = component txModule "Transaction Repository" "electron/services/transaction/repo.ts" "Query SQL langsung: create/get/list/update status transaksi"
        txProductService = component txModule "Product Service" "electron/services/product/service.ts" "updateProductStock() — kurangi/tambah stok saat transaksi/void/refund"
        txShiftService = component txModule "Shift Service" "electron/services/shift/service.ts" "Validasi ada shift terbuka sebelum transaksi"
        txDb = database "SQLite (transactions)" "better-sqlite3 + Drizzle ORM" "Tabel: transactions, transaction_items"

        // ══════════════════════════════════════════════════════════════════════════
        // 3.3 Frontend State Layer (Zustand)
        // ══════════════════════════════════════════════════════════════════════════
        authStore = component zustandLayer "authStore" "Zustand" "user, isAuthenticated, isLoading — login/logout/checkAuth/verifyPin"
        productStore = component zustandLayer "productStore" "Zustand" "products[], categories[], filters — fetchList/setFilter/search"
        customerStore = component zustandLayer "customerStore" "Zustand" "customers[], selectedCustomer — fetchList/select/addPoints"
        shiftStore = component zustandLayer "shiftStore" "Zustand" "currentShift, shiftHistory — checkCurrentShift/open/close"
        dashboardStore = component zustandLayer "dashboardStore" "Zustand" "todaySales, todayTxCount, lowStock — computed dari API"
        settingsStore = component zustandLayer "settingsStore" "Zustand" "fontSize, receiptTemplate, taxRate — loadSettings/saveSetting"
        themeStore = component zustandLayer "themeStore" "Zustand" "theme (light/dark), initTheme, toggleTheme"

        // ── Relationships: 3.1 POS Terminal ──────────────────────────────────────
        posPage -> productGrid "Merender"
        posPage -> cartPanel "Merender"
        posPage -> paymentModal "Membuka dialog pembayaran" "F4"
        posPage -> holdBillModal "Membuka dialog hold bill" "F5"
        posPage -> useBarcode "Menggunakan"
        posPage -> useShortcuts "Menggunakan"
        posPage -> cartStore "Membaca / menulis state cart"

        cartPanel -> cartStore "Membaca items & total"
        paymentModal -> cartStore "Membaca total, reset setelah bayar"
        productGrid -> ipc "product:list, product:getByBarcode" "IPC invoke"
        barcodeInput -> ipc "product:getByBarcode" "IPC invoke"
        paymentModal -> ipc "transaction:create, transaction:hold" "IPC invoke"
        voidRefundModal -> ipc "transaction:void, transaction:refund" "IPC invoke"
        holdBillModal -> ipc "transaction:hold, transaction:listHeld" "IPC invoke"
        cashOutModal -> ipc "cashFlow:recordOut" "IPC invoke"
        receiptPreview -> ipc "printer:print, printer:openDrawer" "IPC invoke"

        // ── Relationships: 3.2 Transaction Service ───────────────────────────────
        ipc -> txIpcHandler "Meneruskan transaction:create/hold/void/refund/listHeld"
        txIpcHandler -> txService "Memanggil service method"
        txService -> txRepo "Menggunakan repo untuk query DB"
        txService -> txProductService "Cek & update stok produk"
        txService -> txShiftService "Cek validasi shift terbuka"
        txRepo -> txDb "SELECT / INSERT / UPDATE" "Drizzle ORM"
        txProductService -> txDb "UPDATE products SET stock" "Drizzle ORM"

        // ── Relationships: 3.3 Zustand State Layer ───────────────────────────────
        posPage -> authStore "useAuthStore()" "Hook selector"
        posPage -> cartStore "useCartStore()" "Hook selector"
        posPage -> productStore "useProductStore()" "Hook selector"
        posPage -> customerStore "useCustomerStore()" "Hook selector"
        posPage -> shiftStore "useShiftStore()" "Hook selector"
        posPage -> dashboardStore "useDashboardStore()" "Hook selector"
        posPage -> settingsStore "useSettingsStore()" "Hook selector"
        posPage -> themeStore "useThemeStore()" "Hook selector"

        authStore -> ipc "authLogin / authMe / authVerifyPin" "invoke"
        cartStore -> ipc "transaction:create / transaction:hold" "invoke"
        productStore -> ipc "product:list / product:getByBarcode / product:lowStock" "invoke"
        customerStore -> ipc "customer:list / customer:create / customer:addPoints" "invoke"
        shiftStore -> ipc "shift:open / shift:close / shift:current" "invoke"
        dashboardStore -> ipc "productCount / productLowStock / transactionList / shiftSummary" "invoke"
        settingsStore -> ipc "settings:getAll / settings:set" "invoke"
        themeStore -> ipc "settings:getTheme / settings:setTheme" "invoke"
    }

    views {
        // ── 3.1 POS Terminal Component Diagram ───────────────────────────────────
        component renderer "POS Terminal Module" {
            include *
            autoLayout lr 250
        }

        // ── 3.2 Transaction Service Component Diagram ─────────────────────────────
        component txModule "Transaction Service" {
            include *
            autoLayout lr 250
        }

        // ── 3.3 Zustand State Layer Component Diagram ─────────────────────────────
        component zustandLayer "Frontend State Layer" {
            include *
            autoLayout lr 250
        }

        // ── Styles ──────────────────────────────────────────────────────────────
        styles {
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "Component" {
                background #85bbf0
                color #000000
            }
            element "Database" {
                shape Cylinder
                background #85bbf0
                color #000000
            }
        }
    }

    theme default
}
