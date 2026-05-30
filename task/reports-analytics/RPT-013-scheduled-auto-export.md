# [RPT-013] Scheduled Auto-Export

**Module**: Reports & Analytics
**Priority**: P2
**Complexity**: M
**Spec Reference**: reports-analytics-spec.md

## Description
Fitur export laporan otomatis harian/mingguan/bulanan ke folder tertentu. Background job menggunakan Node.js scheduler di main process.

## Acceptance Criteria
- [ ] Schedule: harian, mingguan, bulanan
- [ ] Pilih tipe laporan dan format (PDF/Excel)
- [ ] Simpan ke folder yang ditentukan user
- [ ] Log hasil export

## Dependencies
- [RPT-007]
