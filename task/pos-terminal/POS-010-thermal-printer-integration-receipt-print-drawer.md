# [POS-010] Thermal Printer Integration: Receipt Print + Drawer Open

**Module**: POS Terminal
**Priority**: P0
**Complexity**: M
**Spec Reference**: pos-terminal-spec.md Section 8

## Description
Integrasi `node-escpos` atau `electron-pos-printer` di main process. Service untuk format dan print struk thermal (58mm/80mm). Trigger buka cash drawer via printer. Test print function.

## Acceptance Criteria
- [ ] Bisa print struk dengan format: header, items, subtotal, diskon, pajak, total, bayar, kembali, footer
- [ ] Bisa test print tanpa transaksi
- [ ] Buka cash drawer via printer trigger (pulse)
- [ ] Error PRINT_001 jika printer tidak terhubung
- [ ] Error PRINT_002 jika print gagal
- [ ] Receipt template mengambil dari settings (storeName, address)

## Dependencies
- [CORE-008] (transaction data untuk struk)
