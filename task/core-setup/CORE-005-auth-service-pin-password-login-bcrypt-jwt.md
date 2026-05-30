# [CORE-005] Auth Service: PIN & Password Login with bcrypt + JWT

**Module**: Core & Setup
**Priority**: P0
**Complexity**: M
**Spec Reference**: core-setup-spec.md Section 3, Section 4, Section 9

## Description
Implementasi business logic autentikasi di main process: hash comparison bcrypt, PIN validation, JWT token generation (24h expiry). Repo layer untuk CRUD users.

## Acceptance Criteria
- [ ] Login dengan PIN 6 digit berhasil (bcrypt compare)
- [ ] Login dengan email+password berhasil (bcrypt compare)
- [ ] JWT token digenerate dengan expiry 24 jam
- [ ] User inactive ditolak login (error AUTH_003)
- [ ] Password hash menggunakan salt rounds 12

## Dependencies
- [CORE-003]
- [CORE-004]
