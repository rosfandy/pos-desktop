# Changelog

Semua perubahan signifikan pada proyek POS Desktop akan dicatat di sini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/id/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/).

---

## [1.3.2] — 2026-05-30

### Fixed
- **App icon**: Icon aplikasi sekarang menggunakan `build-resources/icon.png` yang di-*extraResources* agar tersedia saat runtime. `win.icon` diubah ke PNG (electron-builder auto-convert ke .ico). Di dev tetap pakai path lokal, di production pakai `process.resourcesPath`.
- **Installer icon**: `win.icon` ganti dari `.ico` ke `.png` agar electron-builder menghasilkan .ico multi-resolusi yang benar.

### Changed
- **Version bump 1.3.2**: Testing auto-updater dengan NSIS `oneClick: true`.

---

## [1.3.0] — 2026-05-30

### Fixed
- **Auto-updater NSIS**: Ganti `oneClick: false` → `oneClick: true` agar update tidak menampilkan wizard instalasi (silent upgrade). Sebelumnya saat user klik "Restart & Pasang", NSIS menampilkan full installer wizard sehingga tampak seperti install ulang.

### Added

### Added
- **Export/Import pelanggan**: Tombol Export dan Import di halaman Manajemen Pelanggan.
  - Export: format Excel (.xlsx) atau CSV (.csv), filter status aktif/nonaktif.
  - Import: upload file Excel/CSV, preview + validasi, commit transaksional.
  - Column aliases mendukung Bahasa Indonesia dan Inggris.

---

## [1.2.0] — 2026-05-30

### Changed
- **Update notification**: Mengganti toast update dengan **UpdateDialog** modal yang menampilkan informasi versi, progress download, serta tombol **Update Sekarang** / **Skip** / **Restart & Pasang**.
- **useAutoUpdater hook**: `toast()` dihapus, mengekspos `showDialog`, `skipUpdate()`, dan state lengkap untuk dialog.

---

## [1.1.0] — 2026-05-30

### Added
- **Font-size preference**: Pengaturan ukuran huruf (Kecil/Sedang/Besar) di tab **Tampilan** halaman Settings. Perubahan diterapkan global via CSS class pada `<html>`.
- **SettingsPage tab Tampilan**: Berisi pengaturan ukuran huruf.
- **ApexCharts laporan**: 4 tab laporan (Penjualan, Produk, Kategori, Transaksi) menggunakan ApexCharts (menggantikan CSS bar chart).
- **Auto-updater skeleton**: IPC handler `updater:check`, `updater:download`, `updater:install` dengan event listener.
- **CHANGELOG.md**: File ini.

### Changed
- **InlineProductTable**: Kolom input Nama Produk (`w-[200px]`), Harga Beli/Jual (`w-[130px]`), Stok diperlebar. Input menggunakan `w-full`. Table `min-w` dari 900px → 1100px.
- **InlineProductTable**: Menambahkan prop `refreshKey` untuk trigger reload eksternal (dipakai setelah import).
- **InventoryLogTable**: `border-separate` → `border-collapse`. Kolom User menampilkan nama (via `LEFT JOIN users`), bukan UUID.
- **Dashboard**: Filter transaksi hanya menampilkan status `'completed'` (void/refund tidak dihitung).
- **ProductPage**: List produk otomatis refresh setelah import dialog ditutup.

### Fixed
- **Export produk** (`bulk-export.service.ts`):
  - Path file menggunakan `path.join()` (sebelumnya string concatenation dengan `/` menyebabkan mixed separator di Windows → error "cannot save file").
  - `XLSX.writeFile` diganti dengan `XLSX.write({ type: 'buffer' })` + `fs.writeFileSync` untuk menghindari potensi bug path di library `xlsx`.
  - Ditambahkan pengecekan & pembuatan direktori `data/` jika belum ada.
  - `require('fs')` diganti dengan `import * as fs`.
- **Import produk** (bulk import):
  - IPC calls via `window.api` (context isolation).
  - Fetch data on dialog open.
  - `ProductPageResult` unwrapped dengan benar (extract `.data`).
  - Empty `WHERE` clause handling.
  - `{ ok, data }` wrapper pada bulk handlers.
- **printer.ts** TS errors: `getPrinters()` → `getPrintersAsync()`, type annotation ditambahkan.
- **Updater handler** (`updater:check`):
  - Handler selalu diregistrasi (tidak diguard `app.isPackaged`), mencegah error "No handler registered" di dev mode.
  - Skip `autoUpdater.checkForUpdates()` jika `!app.isPackaged` untuk mencegah log "Skip checkForUpdates" di dev mode.
- **Akun** `ApiOk` import tidak terpakai di `utils.ts` dihapus.
- **PlaceholderPage** tidak terpakai di `App.tsx` dihapus.
- **Hold bill void**: Void transaksi status `'held'` tidak mengembalikan stok (karena `holdTransaction` tidak pernah mengurangi stok).
- **Shift live data**: Untuk shift aktif, `totalSales` dari DB hanya diisi saat close; live data dari `shiftSummary` API (SUM dari transactions).
- **BulkImportDialog**:
  - File explorer tidak muncul karena `<label>` dengan `<input hidden>` tidak kompatibel di Electron. Diganti dengan `ref` + `.click()` manual.
  - `File.path` tidak tersedia di Electron 33 dengan `contextIsolation: true`. Pendekatan diubah: baca file via `FileReader.readAsArrayBuffer()` di renderer, kirim `Uint8Array` via IPC, parse buffer langsung di main process.
  - Validasi rows diekstrak ke fungsi `validateRows()` async agar bisa dipakai ulang.
- **App icon & title**: Menambahkan `title: 'POS Desktop'` dan `icon` ke `BrowserWindow`. Set `app.setName('POS Desktop')`. Icon menggunakan `build-resources/icon.png`.

---

## [1.0.0] — 2026-05-15

### Added
- Proyek awal dengan Electron + React + TypeScript.
- SQLite database dengan better-sqlite3.
- Autentikasi (login/logout) dengan role admin & kasir.
- Manajemen produk (CRUD, inline edit, bulk save).
- Manajemen kategori.
- Transaksi POS (cart, payment, held bill, void/refund).
- Manajemen inventaris (stok in/out/adjustment, log, stock movement report).
- Manajemen pelanggan (list, form, search, transaction history).
- Shift management (buka/tutup shift, history).
- Pengaturan toko (nama, alamat, telepon, pajak, printer, receipt).
- Export/import produk (Excel & CSV).
- Cetak struk thermal printer.
- Pencadangan database.

### Tech
- Tailwind CSS + shadcn/ui (base-ui/react).
- Zustand untuk state management.
- Aplikasi offline-first.
- Context isolation + nodeIntegration disabled.
