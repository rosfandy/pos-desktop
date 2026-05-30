# [CORE-001] Scaffolding Project Electron + Vite + React + TypeScript

**Module**: Core & Setup
**Priority**: P0
**Complexity**: M
**Spec Reference**: core-setup-spec.md Section 2

## Description
Setup project structure `electron/` dan `src/` dengan Vite untuk renderer dan Electron untuk main process. Konfigurasi TypeScript strict untuk kedua process.

## Acceptance Criteria
- [ ] `npm run dev` menjalankan Electron + Vite dev server
- [ ] Hot reload berfungsi untuk renderer code
- [ ] `electron/main.ts` entry point berjalan
- [ ] `src/main.tsx` mount React root
- [ ] Tidak ada error compile TS di kedua process

## Dependencies
None
