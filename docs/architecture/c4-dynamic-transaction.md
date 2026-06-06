workspace "POS Desktop" "Aplikasi kasir offline-first berbasis Electron untuk UMKM dan retail kecil" {

    model {
        // ── Renderer ─────────────────────────────────────────────────────────────
        spa = softwareSystem "React SPA" "React 18 + TypeScript" "Antarmuka kasir POS"
        cartStore = softwareSystem "cartStore" "Zustand" "State keranjang sementara"
        useBarcode = component spa "useBarcode Hook" "React Hook" "Deteksi input barcode dari USB scanner"

        // ── Main Process ─────────────────────────────────────────────────────────
        main = softwareSystem "Main Process" "Node.js 20+ (Electron)" "Proses utama — lifecycle, IPC, native APIs" {
            tags "Process:Main"
        }

        ipc = component main "IPC Bridge" "preload.ts + ipcMain" "Whitelist channel IPC" {
            tags "Main:IPC"
        }

        // ── Transaction Pipeline ─────────────────────────────────────────────────
        txFlow = container main "Transaction Pipeline" "Main process — transaksi penjualan" {
            tags "Main:Pipeline:Transaction"
        }

        txIpc = component txFlow "Transaction IPC Handler" "ipc/transaction.ts" "Menerima payload dari renderer"
        txService = component txFlow "Transaction Service" "services/transaction/service.ts" "Validasi bisnis & koordinasi"
        txRepo = component txFlow "Transaction Repository" "services/transaction/repo.ts" "Query database transaksi"

        // ── Product Lookup Pipeline ───────────────────────────────────────────────
        productFlow = container main "Product Lookup Pipeline" "Main process — pencarian produk" {
            tags "Main:Pipeline:Product"
        }

        prodIpc = component productFlow "Product IPC Handler" "ipc/product.ts" "Menerima pencarian produk"
        prodService = component productFlow "Product Service" "services/product/service.ts" "Cari produk, cek stok"

        // ── Receipt Printing Pipeline ─────────────────────────────────────────────
        printFlow = container main "Receipt Printing Pipeline" "Main process — cetak struk" {
            tags "Main:Pipeline:Printer"
        }

        printerIpc = component printFlow "Printer IPC Handler" "ipc/printer.ts" "Meneruskan perintah cetak"
        printerSvc = component printFlow "Printer Service" "services/printer/service.ts" "Format struk & kirim ke printer"

        // ── Shift Service ─────────────────────────────────────────────────────────
        shiftSvc = component main "Shift Service" "services/shift/service.ts" "Validasi shift terbuka" {
            tags "Main:Service:Shift"
        }

        // ── Database ──────────────────────────────────────────────────────────────
        db = database main "SQLite Database" "better-sqlite3 + Drizzle ORM" "pos-data.db — tabel products, transactions, inventory_logs, shifts"
        printer = softwareSystem "Thermal Printer" "Mencetak struk dan membuka cash drawer (58mm/80mm)"

        // ══════════════════════════════════════════════════════════════════════════
        // STEP 1 — Scan / Search Product
        // ══════════════════════════════════════════════════════════════════════════
        spa -> useBarcode "1a. Fokus ke input barcode" "focus event"
        useBarcode -> ipc "1b. Scan barcode → product:getByBarcode(barcode)" "IPC invoke"
        ipc -> prodIpc "1c. Forward channel"
        prodIpc -> prodService "1d. Cari produk di DB"
        prodService -> db "1e. SELECT * FROM products WHERE barcode = ?" "Drizzle ORM"
        db -> prodService "1f. Return product row"
        prodService -> prodIpc "1g. Return { ok, data: product }"
        prodIpc -> ipc "1h. Return result"
        ipc -> spa "1i. Return product data"

        // ══════════════════════════════════════════════════════════════════════════
        // STEP 2 — Add to Cart
        // ══════════════════════════════════════════════════════════════════════════
        spa -> cartStore "2a. addItem(product) — update state keranjang" "zustand set()"
        cartStore -> spa "2b. Re-render CartPanel dengan item baru"

        // ══════════════════════════════════════════════════════════════════════════
        // STEP 3 — Process Payment (F4 → Payment Modal → Confirm)
        // ══════════════════════════════════════════════════════════════════════════
        spa -> ipc "3a. transaction:create(dto) + cek stok via product:checkStock" "IPC invoke"
        ipc -> txIpc "3b. Forward transaction:create"
        txIpc -> txService "3c. createSaleTransaction(dto)"
        txService -> prodService "3d. Cek stok tersedia per item"
        prodService -> db "3e. SELECT stock FROM products WHERE id = ?" "Drizzle ORM"
        db -> prodService "3f. Return stock"
        prodService -> txService "3g. Return availableStock"
        txService -> shiftSvc "3h. Cek shiftUser aktif"
        shiftSvc -> db "3i. SELECT * FROM shifts WHERE user_id = ? AND status = 'open'" "Drizzle ORM"
        db -> shiftSvc "3j. Return open shift"
        txService -> txRepo "3k. createTransaction(dto)"
        txRepo -> db "3l. INSERT INTO transactions + INSERT INTO transaction_items" "Drizzle ORM"
        txService -> prodService "3m. updateProductStock(productId, −quantity)"
        prodService -> db "3n. UPDATE products SET stock = stock - ? WHERE id = ?" "Drizzle ORM"
        prodService -> db "3o. INSERT INTO inventory_logs (type='sale')" "Drizzle ORM"

        // ══════════════════════════════════════════════════════════════════════════
        // STEP 4 — Print Receipt
        // ══════════════════════════════════════════════════════════════════════════
        spa -> ipc "4a. printer:print(receiptData)" "IPC invoke"
        ipc -> printerIpc "4b. Forward printer:print"
        printerIpc -> printerSvc "4c. Format struk & kirim ESC/POS"
        printerSvc -> printer "4d. Cetak struk 58mm/80mm" "USB/LAN ESC/POS"

        // ══════════════════════════════════════════════════════════════════════════
        // STEP 5 — Open Cash Drawer (opsional)
        // ══════════════════════════════════════════════════════════════════════════
        spa -> ipc "5. printer:openDrawer()" "IPC invoke"
        ipc -> printerIpc "Forward"
        printerIpc -> printerSvc "Kirim pulse command"
        printerSvc -> printer "Buka laci uang" "ESC/POS pulse"

        // ══════════════════════════════════════════════════════════════════════════
        // STEP 6 — Response to Renderer
        // ══════════════════════════════════════════════════════════════════════════
        txRepo -> txService "6a. Return TransactionWithItems"
        txService -> txIpc "6b. Return { ok, data }"
        txIpc -> ipc "6c. Return via Promise.resolve"
        ipc -> spa "6d. Return { ok, data: transaction }"
        spa -> cartStore "6e. clear() — reset keranjang"
    }

    views {
        // ── Dynamic: Complete Transaction Flow ───────────────────────────────────
        dynamic spa "Transaction Flow — Scan to Receipt" {
            include *
            autoLayout tb 200
        }

        // ── Component: Transaction Pipeline (step-by-step) ───────────────────────
        component txFlow "Transaction Pipeline — Detailed" {
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
