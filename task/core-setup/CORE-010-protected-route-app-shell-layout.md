# [CORE-010] ProtectedRoute & App Shell Layout

**Module**: Core & Setup
**Priority**: P0
**Complexity**: S
**Spec Reference**: core-setup-spec.md Section 6

## Description
Komponen ProtectedRoute yang redirect ke login jika tidak terautentikasi. App shell dengan sidebar navigation dan header yang menampilkan user info. Routing dasar (React Router).

## Acceptance Criteria
- [ ] Route `/login` public, route lainnya protected
- [ ] Redirect otomatis ke login jika token invalid/expired
- [ ] Sidebar menampilkan menu navigasi utama
- [ ] Header menampilkan nama user dan role
- [ ] Logout button di header berfungsi

## Dependencies
- [CORE-006]
- [CORE-007]
