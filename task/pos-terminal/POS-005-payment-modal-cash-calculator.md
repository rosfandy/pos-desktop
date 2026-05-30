# [POS-005] PaymentModal with Cash Calculator

**Module**: POS Terminal
**Priority**: P0
**Complexity**: M
**Spec Reference**: pos-terminal-spec.md Section 6

## Description
Modal pembayaran dengan pilihan metode (Cash, QRIS, Debit, Transfer). Untuk cash: input amount paid dengan tombol cepat (exact, 50k, 100k). Auto-calculate change. Konfirmasi sebelum proses.

## Acceptance Criteria
- [ ] Modal terbuka saat tombol Bayar ditekan
- [ ] Pilihan metode pembayaran: Cash, QRIS, Debit, Transfer
- [ ] Untuk cash: input jumlah bayar dan auto-calculate kembalian
- [ ] Tombol cepat: "Uang Pas", "+50rb", "+100rb"
- [ ] Kembalian tidak boleh negatif (error TRANS_002)
- [ ] Konfirmasi final sebelum simpan transaksi

## Dependencies
- [POS-004]
