# [RPT-007] Export Utility: PDF + Excel Skeleton

**Module**: Reports & Analytics
**Priority**: P0
**Complexity**: M
**Spec Reference**: reports-analytics-spec.md Section 8

## Description
Implementasi export laporan ke PDF (pdf-lib) dan Excel (xlsx) di main process. Utility functions `generatePDF` dan `generateExcel`. Gunakan mock report data untuk development awal.

## Acceptance Criteria
- [ ] `generatePDF` membuat file PDF dengan title, date range, summary, table
- [ ] `generateExcel` membuat file .xlsx dengan sheet laporan
- [ ] Filename format: `laporan-[tipe]-YYYY-MM-DD.pdf/xlsx`
- [ ] File disimpan ke lokasi yang dipilih user via dialog
- [ ] Error RPT_003 jika export gagal
- [ ] Bisa handle report data dengan 1000+ rows

## Dependencies
- [RPT-001]
