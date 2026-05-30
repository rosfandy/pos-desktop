# Product Requirements Document (PRD)

## Aplikasi Desktop Kasir POS (Point of Sale)

---

## 1. Informasi Proyek

| **Field** | **Detail** |
|-----------|-----------|
| **Nama Proyek** | POS Desktop - Sistem Kasir Berbasis Electron |
| **Versi** | 1.0.0 |
| **Tanggal** | 28 Mei 2026 |
| **Platform** | Desktop (Windows, macOS, Linux) |
| **Teknologi Utama** | Electron, HTML/CSS/JS (atau framework seperti React/Vue) |
| **Target Rilis** | Q3 2026 |

---

## 2. Executive Summary

Aplikasi POS Desktop adalah solusi kasir offline-first yang dibangun menggunakan Electron untuk membantu UMKM, retail kecil, dan restoran dalam mengelola transaksi penjualan harian. Aplikasi berjalan sebagai native desktop app dengan kemampuan sinkronisasi data ke cloud (opsional) dan menyediakan antarmuka yang responsif, cepat, dan mudah digunakan.

---

## 3. Tujuan dan Sasaran

### 3.1 Tujuan Utama
- Mempermudah proses transaksi penjualan di lokasi tanpa ketergantungan internet (offline-first)
- Mengelola inventori produk, pelanggan, dan laporan penjualan secara terintegrasi
- Menyediakan performa tinggi dengan UX native desktop melalui Electron

### 3.2 Sasaran
- Waktu respon transaksi < 1 detik
- Mendukung 10.000+ produk dalam database lokal
- Startup aplikasi < 3 detik
- Mendukung thermal printer, barcode scanner, dan cash drawer

---

## 4. Target Pengguna

| **Segment** | **Kebutuhan Utama** |
|-------------|---------------------|
| **Toko Retail Kecil** | Transaksi cepat, manajemen stok sederhana, laporan harian |
| **Restoran / Cafe** | Manajemen meja, split bill, kitchen order |
| **UMKM / Warung** | Interface sederhana, harga terjangkau (tanpa cloud fee wajib) |
| **Apotek / Minimarket** | Scan barcode, manajemen batch/expired, multi-kategori |

---

## 5. Fitur Utama (Core Features)

### 5.1 Modul Transaksi (POS Terminal)
- **Kasir utama** dengan cart/daftar belanja real-time
- **Scan barcode** via kamera atau USB barcode scanner
- **Pencarian produk** cepat (fuzzy search)
- **Multi-metode pembayaran**: Tunai, Debit, QRIS, Transfer
- **Kalkulasi otomatis**: subtotal, diskon (nominal/persen), pajak, kembalian
- **Hold/Save bill** (simpan transaksi sementara)
- **Void/Refund** item atau transaksi (dengan autorisasi)
- **Cetak struk** via thermal printer (58mm/80mm)
- **Buka cash drawer** via printer trigger

### 5.2 Modul Manajemen Produk
- CRUD produk: nama, SKU/barcode, harga beli, harga jual, stok, satuan, kategori
- **Multi-satuan stok**: mendukung berbagai satuan (pcs, lusin, kg, 1/2 kg, 1/4 kg, gram, meter, liter, dll)
- **Konversi satuan**: otomatis hitung stok dasar (misal: 1 lusin = 12 pcs, 1 kg = 1000 gram)
- **Harga per satuan**: bisa jual dengan harga berbeda per satuan (1 pcs vs 1 lusin)
- **Bulk import/export** via Excel/CSV
- Manajemen kategori dan sub-kategori
- **Low stock alert** (notifikasi stok hampir habis)
- Gambar produk (thumbnail)

### 5.3 Modul Manajemen Inventori
- **Stock in/out** tracking
- Riwayat perubahan stok (audit trail)
- Adjustment stok (rusak, hilang, expired)
- Multi-location warehouse (gudang / toko)

### 5.4 Modul Pelanggan (CRM Dasar)
- Database pelanggan: nama, telepon, email, alamat
- **Membership/loyalty**: poin reward, tier member
- Riwayat transaksi per pelanggan
- Hutang piutang (credit sales) - versi Pro

### 5.5 Modul Laporan & Analitik
- **Dashboard ringkasan**: penjualan hari ini, minggu ini, bulan ini
- Laporan penjualan detail (by date, by product, by category, by cashier)
- Laporan stok (current stock, stock movement)
- Laporan keuangan (profit/loss, expenses)
- Export laporan ke PDF / Excel
- Grafik visual (chart) untuk trend penjualan

### 5.6 Modul Pengguna & Autentikasi
- **Multi-user**: Admin, Manager, Kasir
- Role-based access control (RBAC)
- Login dengan PIN (cepat) atau password
- **Session management**: shift kasir (buka/tutup shift)

### 5.7 Modul Pengaturan
- Pengaturan toko: nama, alamat, logo, nomor telepon, NPWP
- Pengaturan pajak (PPN/VAT) dan service charge
- Pengaturan printer (thermal printer setup, test print)
- Pengaturan tampilan struk (customizable receipt template)
- Backup dan restore database lokal
- Update aplikasi OTA (via Electron auto-updater)

---

## 6. Fitur Tambahan (Nice to Have)

| **Fitur** | **Deskripsi** | **Prioritas** |
|-----------|-------------|---------------|
| Sinkronisasi Cloud | Sync data ke backend cloud saat online | Medium |
| Multi-cabang | Kelola beberapa outlet dari satu aplikasi | Low |
| E-commerce Integration | Sinkron dengan Tokopedia/Shopee API | Low |
| E-faktur | Generate faktur pajak elektronik | Low |
| Kitchen Display System (KDS) | Tampilan order untuk dapur (restoran) | Medium |
| E-Wallet Integration | Direct payment dengan QRIS merchant | Medium |

---

## 7. Spesifikasi Teknis

### 7.1 Arsitektur Electron

```
┌─────────────────────────────────────────────┐
│            Electron Main Process            │
│  - App lifecycle management                 │
│  - Window management                          │
│  - IPC Communication bridge                 │
│  - Native API integration (printer, file)   │
│  - Auto-updater (electron-updater)          │
│  - SQLite database (via better-sqlite3)     │
└──────────────┬──────────────────────────────┘
               │ IPC (Inter-Process Communication)
               ▼
┌─────────────────────────────────────────────┐
│          Electron Renderer Process          │
│  - UI Frontend (React + TypeScript)         │
│  - POS Terminal Interface                   │
│  - Dashboard & Charts                       │
│  - Form inputs & validation                 │
│  - Local state management (Zustand/Redux)   │
└─────────────────────────────────────────────┘
```

### 7.2 Tech Stack

| **Layer** | **Teknologi** | **Alternatif** |
|-----------|--------------|----------------|
| **Framework Desktop** | Electron | Tauri (future consideration) |
| **Frontend UI** | React + TypeScript | - |
| **Styling** | Tailwind CSS + shadcn/ui | - |
| **State Management** | Zustand | - |
| **Database Lokal** | SQLite (better-sqlite3) | IndexedDB (Dexie.js) |
| **Database ORM/Query** | Drizzle ORM / Knex.js | Prisma (via electron IPC) |
| **Printing** | node-escpos / electron-pos-printer | node-printer |
| **Packaging** | electron-builder | electron-forge |
| **Auto-update** | electron-updater | - |
| **Testing** | Vitest (unit), Playwright (E2E) | Jest, Cypress |

### 7.3 Struktur Folder (Rekomendasi)

```
pos-desktop/
├── electron/                  # Main process code
│   ├── main.ts               # Entry point Electron
│   ├── preload.ts            # Preload script (IPC bridge)
│   ├── ipc/                  # IPC handlers
│   ├── db/                   # Database setup & migrations
│   ├── services/             # Business logic (Node.js side)
│   └── utils/                # Utilities
├── src/                       # Renderer process (frontend)
│   ├── components/           # React components
│   ├── pages/                # Screens (POS, Products, Reports)
│   ├── hooks/                # Custom React hooks
│   ├── stores/               # Zustand stores
│   ├── lib/                  # Utils, API clients
│   └── types/                # TypeScript types
├── resources/                 # Assets, icons, fonts
├── database/                  # Migration files
├── dist/                      # Build output
├── package.json
└── electron-builder.yml
```

### 7.4 Keamanan (Security)
- **Context Isolation**: `contextIsolation: true`
- **Content Security Policy (CSP)**: strict CSP header
- **Sanitasi Input**: validasi dan sanitasi semua input user
- **Enkripsi Database**: enkripsi SQLite untuk data sensitif (SQLCipher)
- **Secure IPC**: validasi semua payload IPC, whitelist channels
- **No remote code**: `nodeIntegration: false`, load local files only

### 7.5 Database Schema (SQLite)

**Tabel Utama:**
- `users` (id, name, email, pin, password_hash, role, is_active)
- `products` (id, sku, barcode, name, category_id, price_buy, price_sell, stock, base_unit, image_path, min_stock)
- `product_units` (id, product_id, unit_name, conversion_factor, price_sell, is_default)
- `categories` (id, name, parent_id)
- `customers` (id, name, phone, email, address, points, tier)
- `transactions` (id, invoice_number, customer_id, user_id, subtotal, discount, tax, total, payment_method, amount_paid, change, status, created_at)
- `transaction_items` (id, transaction_id, product_id, quantity, unit, price, discount)
- `inventory_logs` (id, product_id, type, quantity, unit, reason, user_id, created_at)
- `shifts` (id, user_id, opened_at, closed_at, opening_cash, closing_cash, total_sales)
- `settings` (key, value)

---

## 8. Persyaratan UI/UX

### 8.1 Prinsip Desain
- **Touch-friendly**: Tombol besar, minimal target 44x44px
- **Dark & Light mode**: support tema terang dan gelap
- **Keyboard-first**: Shortcut keyboard untuk semua operasi utama (F2=search, F4=payment, Esc=cancel)
- **Responsive layout**: support layar kecil (10 inch tablet) hingga widescreen monitor

### 8.2 Wireframe Halaman Utama

#### Halaman Kasir (POS)
```
┌────────────────────────────────────────────────────────┐
│ [Logo]  POS System        [User] [Shift Info] [⚙] [X] │
├──────────────┬─────────────────────────────────────────┤
│              │  Cart / Daftar Belanja                  │
│  KATEGORI    │  ┌──────────────────────────────────┐ │
│  [Makanan]   │  │ Nasi Goreng    x2    Rp 60.000   │ │
│  [Minuman]   │  │ Es Teh         x1    Rp  5.000     │ │
│  [Snack]     │  │                                    │ │
│              │  └──────────────────────────────────┘ │
│              │  Subtotal:               Rp 65.000    │
│  PRODUK      │  Diskon:                 Rp  5.000    │
│  [Grid/List] │  Pajak (10%):            Rp  6.000    │
│              │  ──────────────────────────────────   │
│              │  TOTAL:                  Rp 66.000    │
│              │                                       │
│              │  [Bayar Tunai] [QRIS] [Debit]        │
└──────────────┴─────────────────────────────────────────┘
```

#### Shortcut Keyboard
| **Tombol** | **Aksi** |
|------------|----------|
| F2 / Ctrl+F | Fokus ke pencarian produk |
| F4 | Buka dialog pembayaran |
| F5 | Hold/Simpan transaksi |
| F6 | Load transaksi yang di-hold |
| F7 | Cetak ulang struk terakhir |
| Esc | Batal / Tutup dialog |
| + / - | Tambah/kurangi jumlah item |
| Delete | Hapus item dari cart |

---

## 9. Persyaratan Hardware

### 9.1 Minimum System Requirements
- **OS**: Windows 10 (64-bit), macOS 10.15+, Ubuntu 18.04+
- **RAM**: 4 GB
- **Storage**: 500 MB (instalasi) + space untuk database
- **Display**: 1280x720
- **CPU**: Intel Core i3 / AMD Ryzen 3 (atau setara)

### 9.2 Perangkat Pendukung (Opsional)
- **Printer Thermal**: Epson TM-T82, XPrinter XP-58/80 (USB/LAN/Bluetooth)
- **Barcode Scanner**: USB HID (plug & play)
- **Cash Drawer**: RJ11/RJ12 connected to printer
- **Customer Display**: Pole display via Serial/COM
- **Kamera**: untuk scan QR code payment

---

## 10. Persyaratan Performa

| **Metric** | **Target** |
|------------|------------|
| Waktu Startup | < 3 detik |
| Pencarian Produk | < 200ms (10.000+ produk) |
| Simpan Transaksi | < 500ms (sudah termasuk print) |
| Navigasi Halaman | < 100ms |
| Ukuran Installer | < 150 MB |
| Penggunaan RAM | < 300 MB (idle) |

---

## 11. Rencana Implementasi (Roadmap)

### Fase 1: MVP (8-10 Minggu)
- Setup project Electron + React + SQLite
- Autentikasi dan manajemen user
- CRUD Produk & Kategori
- Transaksi kasir dasar (tunai + print struk)
- Laporan penjualan harian
- Backup/restore database

### Fase 2: Enhancement (4-6 Minggu)
- Manajemen pelanggan & membership
- Shift kasir (open/close)
- Multi-metode pembayaran (QRIS, debit)
- Laporan detail dengan chart
- Pengaturan struk & printer
- Auto-updater

### Fase 3: Advanced (4-6 Minggu)
- Sinkronisasi cloud (opsional)
- Kitchen Display System (restoran)
- Hutang piutang
- Multi-cabang (jika diperlukan)
- API integrasi e-commerce

---

## 12. Kriteria Penerimaan (Acceptance Criteria)

### AC-1: Transaksi Dasar
**Diberikan** kasir sudah login dan ada produk di database  
**Ketika** kasir menambahkan 3 produk ke cart dan menekan bayar tunai  
**Maka** transaksi tersimpan, struk tercetak, stok berkurang, dan kembalian dihitung dengan benar.

### AC-2: Offline Operation
**Diberikan** aplikasi dalam mode offline (tidak ada internet)  
**Ketika** kasir melakukan transaksi dan menambah produk baru  
**Maka** semua data tersimpan lokal dan tidak ada error, aplikasi tetap responsif.

### AC-3: Backup & Restore
**Diberikan** database memiliki 1000+ transaksi  
**Ketika** user melakukan backup ke file `.db`  
**Maka** file backup tercipta dalam < 5 detik dan bisa di-restore di perangkat lain.

---

## 13. Risiko dan Mitigasi

| **Risiko** | **Dampak** | **Mitigasi** |
|------------|------------|--------------|
| Performa SQLite menurun saat data besar | Tinggi | Gunakan indexing, pagination, dan archival data lama |
| Kompatibilitas printer thermal | Sedang | Gunakan library printing yang support banyak model, provide test print |
| Antivirus false-positive pada installer | Sedang | Code signing certificate (EV Code Signing) |
| Data corruption pada crash | Tinggi | Implementasi WAL mode SQLite, auto-backup rutin |
| Learning curve Electron untuk tim | Rendah | Dokumentasi internal, boilerplate yang solid |

---

## 14. Dokumentasi & Deliverables

- [ ] Dokumentasi setup development (README.md)
- [ ] User Manual / Buku Panduan Kasir (PDF)
- [ ] Video tutorial singkat (YouTube/Unlisted)
- [ ] API Documentation (jika ada cloud sync)
- [ ] Changelog per rilis

---

## 15. Lampiran

### A. Alur Kerja Transaksi (Flowchart)

```
[Mulai] → [Scan/Search Produk] → [Tambah ke Cart]
   ↓
[Ada Item Lain?] ──Ya──→ [Scan/Search Produk]
   ↓ Tidak
[Hitung Total] → [Pilih Metode Pembayaran]
   ↓
[Proses Pembayaran] → [Cetak Struk]
   ↓
[Simpan Transaksi] → [Update Stok] → [Selesai]
```

### B. Struktur Data Struk (Contoh)

```
================================
      TOKO MAJU JAYA
   Jl. Merdeka No. 123
   Telp: 0812-3456-7890
================================
No. Inv: INV-20260528-0001
Kasir : Budi
Tgl   : 28/05/2026 14:32
--------------------------------
Nasi Goreng      x2  60.000
Es Teh Manis     x1   5.000
Gula Pasir    1/2kg  12.500
Tepung Terigu  1lusin 48.000
--------------------------------
Subtotal           125.500
Diskon              -5.000
Pajak 10%          12.050
--------------------------------
TOTAL              122.550
Bayar (Tunai)      150.000
Kembali             27.450
--------------------------------
 Terima Kasih Atas Kunjungan
       Anda!
================================
```

### C. Contoh Konversi Satuan

| Produk | Satuan Jual | Konversi | Stok Dasar |
|--------|-------------|----------|------------|
| Gula Pasik | kg | 1 kg = 1000 gram | 5000 gram |
| Gula Pasik | 1/2 kg | 1/2 kg = 500 gram | - |
| Gula Pasik | 1/4 kg | 1/4 kg = 250 gram | - |
| Tepung Terigu | lusin | 1 lusin = 12 pcs | 240 pcs |
| Tepung Terigu | pcs | 1 pcs | - |
| Minyak Goreng | liter | 1 liter = 1000 ml | 10000 ml |

---

## Catatan Revisi

| **Versi** | **Tanggal** | **Perubahan** | **Oleh** |
|-----------|-------------|---------------|----------|
| 1.0.0 | 28 Mei 2026 | Dokumen awal | Product Team |
| 1.0.1 | 28 Mei 2026 | Tambah fitur multi-satuan & konversi satuan | Product Team |

---

*End of Document*
