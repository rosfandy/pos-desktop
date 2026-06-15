# POS Desktop

Aplikasi kasir Point of Sale (POS) offline untuk UMKM, retail, dan restoran.

## Fitur

- Transaksi penjualan dengan cart dan barcode scanner
- Multi-metode pembayaran: tunai, debit, QRIS, transfer
- Hold bill dan void/refund
- Cetak struk thermal printer + buka cash drawer
- Manajemen produk dan inventori
- Manajemen pelanggan dan loyalty points
- Laporan penjualan dan stok
- Manajemen shift kasir
- Auto-update dan backup database

## Instalasi

1. Download installer dari halaman [Releases](https://github.com/rosfandy/pos-desktop/releases)
2. Jalankan `POS Desktop Setup.exe`
3. Ikuti petunjuk instalasi
4. Buka aplikasi dari Start Menu atau desktop shortcut

## Penggunaan

### Login
Buka aplikasi, masukkan PIN atau password akun kasir/admin.

### Transaksi
1. Scan barcode atau cari produk di kolom pencarian
2. Atur jumlah item, klik **Tambah** untuk masukkan ke keranjang
3. Klik **Bayar** untuk memulai pembayaran
4. Pilih metode pembayaran dan masukkan jumlah diterima
5. Klik **Simpan & Print** untuk cetak struk dan buka cash drawer

### Hold Bill
Klik **Tahan** di halaman pembayaran untuk menyimpan transaksi sementara. Bill tersimpan di menu **Hold Bill** dan bisa diambil kembali kapan saja.

### Void / Refund
Buka detail transaksi dari riwayat, klik **Void/Refund** dan masukkan alasan. Transaksi void hanya bisa dilakukan oleh admin.

### Manajemen Produk
Buka menu **Produk** untuk menambah, edit, atau hapus produk. Gunakan tombol **Import** untuk upload stok awal via Excel.

### Laporan
Buka menu **Laporan** untuk melihat:
- Ringkasan penjualan harian
- Laporan stok
- Laporan keuangan per shift
- Grafik penjualan

### Shift
Setiap kasir harus **Buka Shift** sebelum mulai bertransaksi dan **Tutup Shift** saat berakhir shift. Ringkasan shift tersimpan di menu **Shift**.

### Pengaturan
Buka menu **Pengaturan** untuk mengubah:
- Nama, alamat, dan kontak toko
- Pajak dan mata uang
- Konfigurasi printer dan template struk
- Preferensi tampilan (ukuran huruf, tema)

## Kontak

Repository: [github.com/rosfandy/pos-desktop](https://github.com/rosfandy/pos-desktop)
