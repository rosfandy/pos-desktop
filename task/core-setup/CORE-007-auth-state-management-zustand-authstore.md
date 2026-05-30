# [CORE-007] Auth State Management: Zustand authStore

**Module**: Core & Setup
**Priority**: P0
**Complexity**: S
**Spec Reference**: core-setup-spec.md Section 5

## Description
Implementasi Zustand store untuk state autentikasi: user, isAuthenticated, isLoading. Methods: login, logout, checkAuth. Token disimpan di localStorage.

## Acceptance Criteria
- [ ] `authStore` menyimpan user object setelah login
- [ ] `checkAuth` dipanggil saat app mount untuk validasi token
- [ ] `logout` menghapus token dari localStorage dan reset state
- [ ] Persist state setelah refresh halaman (via localStorage token)

## Dependencies
- [CORE-005]
- [CORE-006]
