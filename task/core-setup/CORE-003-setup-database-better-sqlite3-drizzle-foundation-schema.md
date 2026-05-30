# [CORE-003] Setup Database: better-sqlite3 + Drizzle ORM + Foundation Schema

**Module**: Core & Setup
**Priority**: P0
**Complexity**: M
**Spec Reference**: core-setup-spec.md Section 3

## Description
Inisialisasi koneksi SQLite via better-sqlite3 di main process. Definisikan schema Drizzle ORM untuk tabel foundation: `users`, `settings`, `shifts`. Buat migration runner sederhana dan seed default admin user.

## Acceptance Criteria
- [ ] Database file `.db` terbentuk saat app pertama kali jalan
- [ ] Schema users, settings, shifts terdefinisi di `electron/db/schema.ts`
- [ ] Migration runner menjalankan file di `database/migrations/`
- [ ] Seed admin user (role: admin, PIN: 123456) otomatis jika tabel kosong
- [ ] Drizzle ORM bisa query dari main process

## Dependencies
- [CORE-001]
