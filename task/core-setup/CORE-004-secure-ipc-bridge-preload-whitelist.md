# [CORE-004] Secure IPC Bridge: Preload + Whitelist Pattern

**Module**: Core & Setup
**Priority**: P0
**Complexity**: M
**Spec Reference**: core-setup-spec.md Section 4, Section 9

## Description
Buat `preload.ts` dengan contextIsolation: true dan nodeIntegration: false. Definisikan API bridge untuk auth dan settings dengan validasi payload. Semua channel IPC di-whitelist eksplisit.

## Acceptance Criteria
- [ ] `preload.ts` expose `window.api` object ke renderer
- [ ] Hanya channel yang di-whitelist bisa dipanggil dari renderer
- [ ] Payload IPC divalidasi sebelum diproses handler
- [ ] Renderer tidak bisa akses Node.js API langsung
- [ ] TypeScript types untuk `window.api` tersedia di `src/lib/api.ts`

## Dependencies
- [CORE-001]
