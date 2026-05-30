# [CORE-006] Auth UI: LoginPage + PinPad Components

**Module**: Core & Setup
**Priority**: P0
**Complexity**: M
**Spec Reference**: core-setup-spec.md Section 6

## Description
Buat halaman login dengan dua mode: PIN pad numerik dan email/password form. Gunakan shadcn/ui components. Implementasi loading state dan error handling dengan pesan Indonesia.

## Acceptance Criteria
- [ ] LoginPage menampilkan PinPad secara default
- [ ] Toggle ke email/password form tersedia
- [ ] PinPad memiliki tombol numerik 0-9, backspace, clear
- [ ] Error message muncul sesuai kode (AUTH_001, AUTH_002, AUTH_003)
- [ ] Setelah login sukses, redirect ke halaman utama (dashboard/pos)

## Dependencies
- [CORE-002]
- [CORE-005]
