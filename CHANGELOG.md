# Changelog

Semua perubahan signifikan pada proyek POS Desktop akan dicatat di sini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/id/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added


---

## [1.5.5] — 2026-06-03

### Added
- **Default title toast per variant** — Toast tanpa `title` eksplisit otomatis pakai judul sesuai variant: `"Berhasil"` (success), `"Error"` (destructive), `"Info"` (info/default).
- **Kolom Status di laporan keuangan** — Tabel "Uang di Tangan per Shift" menampilkan status shift (Buka/Tutup) dengan badge hijau/abu.
- **Toast error di TransactionDetailModal** — Gagal load transaksi dan gagal print struk sekarang menampilkan toast, bukan silent catch.

### Changed
- **Toast posisi ke tengah atas** — Dari pojok kanan bawah ke `top-0 left-1/2 -translate-x-1/2`. Durasi dinaikkan 1200ms → 4000ms.
- **Toast font variants** — Variant `success`/`destructive`/`info` pakai `text-white` agar terbaca di background gelap.
- **"Buka Shift" langsung popup di POS** — Tombol Buka Shift di dialog "Shift Belum Dibuka" membuka `OpenShiftModal` inline, tidak redirect ke halaman `/shifts`.
- **Input qty keranjang pure input** — Qty di CartPanel diganti jadi `<Input>` dengan support desimal (koma/titik). Tombol ± tetap ada.
- **Search produk dikosongkan setelah tambah** — Input pencarian di POS terminal otomatis clear setelah item ditambahkan ke keranjang.
- **Shadow/ring dihapus dari semua dialog** — `shadow-2xl` dihapus dari seluruh komponen `DialogContent` (POS modals, shift modals, payment, dll). `ring-1` dihapus dari base `DialogContent`.

### Fixed
- **Qty 0 tidak remove item** — Tombol decrement di CartPanel tidak lagi menghapus item saat qty mencapai 0 (min qty = 1).

---

## [1.5.4] — 2026-05-31

### Changed
- **Qty keranjang bisa diedit langsung + decimal** — di `CartPanel`, qty item berubah dari `<span>` statis menjadi `<Input type="number" step="any">` sehingga pengguna bisa mengetik nilai desimal (misal 0.5, 1.5). Tombol ± tetap ada untuk increment/decrement 1.
- **Pencarian produk langsung ke DB** — `InlineProductTable` tidak lagi filter client-side; pencarian & filter kategori query langsung ke database via `product:list` dengan parameter `search`/`categoryId`, memastikan data selalu sinkron.

### Fixed
- **SQL search bug** — `buildWhere` di service produk: sebelumnya string `%` di-double wrap (`LIKE '%%term%'`), diperbaiki jadi `LIKE '%term%'`.

---

## [1.5.2] — 2026-05-31

### Changed
- **CustomerForm: no. telepon tidak wajib** — validasi `required` dihapus, label diganti dari "Telepon *" jadi "Telepon", format tetap divalidasi jika diisi.
- **CustomerForm: tombol simpan fixed di bawah** — `DialogContent` diubah jadi `flex flex-col`, body form di-scroll, footer tetap di bawah (`shrink-0`).
- **Struk ESC/POS lebih compact** — Total Item & Total Qty digabung jadi 1 baris (`Total → 1 item, 2 pcs`); spasi berlebih (`newLine`) sebelum dan sesudah bagian pembeli dihapus; `newLine` sebelum `cut()` dikurangi dari 2 jadi 1.
- **Struk preview (ReceiptCard) lebih compact** — padding header/body/footer dikurangi (px-5→px-4, py-3→py-2, dll); cell tabel dikurangi (`py-1.5`→`py-1`); jarak Total dan footer dikurangi.
- **Info pembeli di struk 1 baris** — nama pelanggan dan poin digabung: `Pembeli: B. Johan (150)`, termasuk poin earned jika ada. Diterapkan di ESC/POS dan ReceiptCard.

## [1.5.1] — 2026-05-31

### Added
- **Poin bisa diedit di form pelanggan**: Field poin (input number) ditambahkan di form Tambah/Edit Pelanggan, sehingga poin bisa diatur manual.
- **Total Item & Total Qty di struk termal**: Setelah daftar item, struk ESC/POS menampilkan ringkasan jumlah item dan total kuantitas.

### Fixed
- **Tanggal struk print salah**: `createdAt` dari SQLite dalam detik, tapi `new Date()` butuh milidetik. Diperbaiki di `buildReceiptData`, `TransactionDetailModal`, dan `ReceiptPreview` dengan mengalikan `tx.createdAt * 1000`.
- **Void/Refund button tidak bereaksi**: Syntax error JSX (`{showVoidRefund ?? showVoidRefund : "taek"}`) di `POSTerminalPage.tsx` menyebabkan `VoidRefundModal` tidak pernah di-render.

---

## [1.5.0] — 2026-05-31

### Added
- **Sidebar collapsible**: Sidebar bisa diciutkan ke mode ikon-only (`w-14`) atau diperluas kembali (`w-48`) via tombol toggle di toolbar. State disimpan ke `localStorage`.
- **Cash flow per item**: Setiap item yang terjual dicatat sebagai entri `type='in'` di tabel kas (`Penjualan: <nama produk> (INV-xxx)`).
- **Pelanggan di hold bill**: Dialog konfirmasi tahan bill kini memiliki field `CustomerSearch` opsional untuk mengaitkan pelanggan ke bill yang ditahan.
- **Info pelanggan & poin di struk**: Struk termal (ESC/POS) dan preview struk menampilkan nama pelanggan, tier loyalitas, poin yang diperoleh, dan saldo poin.

### Changed
- **`holdBill` terima `overrideCustomerId`**: Signature diubah menjadi `holdBill(notes?, overrideCustomerId?)` sehingga dialog hold bisa mengirim pelanggan yang dipilih secara independen dari state keranjang.
- **Sidebar & Toolbar dipindah ke fragments**: `Sidebar`, `Toolbar`, `StatusBar`, dan `navConfig` diekstrak dari `App.tsx` ke `src/components/fragments/` untuk menjaga App.tsx tetap ramping.
- **Save bar Settings fixed**: Tombol "Simpan Pengaturan" di `SettingsPage` kini `shrink-0` di luar scroll area — tidak lagi ikut tergulir saat konten panjang.

### Fixed
- **Void/Refund button tidak bereaksi**: Syntax error JSX (`{showVoidRefund ?? showVoidRefund : "taek"}`) di `POSTerminalPage.tsx` menyebabkan `VoidRefundModal` tidak pernah di-render.
- **`holdBill` userId placeholder**: `userId` di `holdBill` sekarang membaca dari `useAuthStore` (bukan string statis `'current-user-id'`).

---

## [1.4.0] — 2026-05-30

### Fixed
- **Import customer hanya commit 10 baris**: Bug kritis — preview menyimpan hanya 10 baris (slice untuk display) tapi data yang di-commit juga 10 baris itu. Sekarang `allRows` menyimpan SEMUA baris hasil preview, sementara `previewRows` hanya untuk display. Commit pakai `allRows`.
- **ProductList search tdk ke seluruh DB**: Sebelumnya search hanya filter in-memory dari produk yang sudah diload (default 50). Sekarang search dikirim ke backend (debounce 300ms) via `fetchProducts({ search })`.
- **ProductList infinite scroll**: Ditambahkan `IntersectionObserver` di bagian bawah tabel. Saat scroll mendekati akhir, `loadMoreProducts()` dipanggil dengan cursor-based pagination.
- **Soft delete → Hard delete**: `deleteCustomer` sekarang `DELETE FROM` (hard delete), bukan set `is_active = 0`.
- **Konsep active/inactive customer dihapus**: `isActive` dihapus dari `CustomerRow`, `CustomerFilter`, semua query backend, export, import, UI (checkbox Tampilkan nonaktif), dan store.

### Added
- **Bulk delete customer**: Checkbox per baris + select all di tabel customer. Tombol "Hapus N" muncul di header saat ada yang dipilih. Konfirmasi sebelum hapus. Backend `customer:bulkDelete` dengan transaksi SQL.
- **Export/Import pelanggan**: File .xlsx/.csv tanpa kolom Status.

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
