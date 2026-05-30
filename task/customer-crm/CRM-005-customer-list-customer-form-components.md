# [CRM-005] CustomerList + CustomerForm Components

**Module**: Customer CRM
**Priority**: P0
**Complexity**: M
**Spec Reference**: customer-crm-spec.md Section 7

## Description
Halaman daftar pelanggan dengan tabel (nama, telepon, tier, poin, total spent). Form create/edit customer: nama, telepon, email, alamat. Validasi phone unique.

## Acceptance Criteria
- [ ] Tabel menampilkan pelanggan dengan pagination
- [ ] Search real-time by nama atau telepon
- [ ] Form validasi: nama wajib, telepon wajib & unique
- [ ] Tier badge dengan warna (bronze=coklat, silver=abu, gold=kuning, platinum=ungu)
- [ ] Tombol edit dan delete pada setiap row

## Dependencies
- [CRM-004]
