# Progress: CORE — Windows Installer & Auto-Updater

**Started**: 2026-05-30
**Last Updated**: 2026-05-30

**Status**: 🟢 PHASE 1 COMPLETE — Portable build berhasil dijalankan

---

## Summary

| Total Items | Completed | In Progress | Pending | Blocked |
|-------------|-----------|-------------|---------|---------|
| 18          | 9         | 0           | 9       | 0       |

---

## Checklist Progress

### Phase 1 — Windows Installer (electron-builder) ✅ COMPLETE

- [x] Tambah build scripts di `package.json`: `electron:build:win`, `electron:build:dir` ✓ 2026-05-30
- [x] Konfigurasi `build` block di `package.json`: appId, productName, copyright, asar ✓ 2026-05-30
- [x] Konfigurasi target Windows: NSIS installer + portable (x64) ✓ 2026-05-30
- [x] Buat folder `build-resources/` ✓ 2026-05-30
- [x] Buat `build-resources/icon.ico` (dari System.Drawing PNG → ICO) ✓ 2026-05-30
- [x] Buat `build-resources/installer.nsh` (minimal placeholder) ✓ 2026-05-30
- [x] Fix `winCodeSign` extraction error:
  - `sign: false` + `signAndEditExecutable: false` di `package.json`
  - `publish: null` di `win` block
  - `electron-builder.dev.json` untuk dev builds tanpa `win` signing config ✓ 2026-05-30
- [x] Test build dir: `npm run electron:build:dir` ✅ `POS Desktop.exe` 188 MB ✓ 2026-05-30
- [x] Test build portable: `electron-builder --win portable` ✅ `POS Desktop 0.1.0.exe` 71 MB ✓ 2026-05-30
- [x] Verifikasi: app berhasil di-launch (PID 4224) ✓ 2026-05-30
- [ ] Verifikasi NSIS installer (butuh Windows SDK / cert untuk signing) — optional untuk production
- [ ] Setup `publish` GitHub Releases untuk auto-updater (ditunda sampai Phase 2)

---

### Phase 2 — Auto-Updater (electron-updater) 🟡

#### 2.1 Infrastruktur

- [x] Konfigurasi `publish` di `package.json`: GitHub Releases provider ✓ 2026-05-30
- [ ] Install `electron-updater`
  - **Status**: In Progress
  - **Command**: `npm install electron-updater`
- [ ] Buat `electron/services/updater/service.ts`
  - **Status**: Pending
  - **Notes**: checkForUpdates, onUpdateAvailable, onDownloadProgress, onUpdateDownloaded, quitAndInstall
- [ ] Buat `electron/ipc/updater.ts`
  - **Status**: Pending
  - **Channels**: `updater:check`, `updater:download`, `updater:install`, `updater:on-status`
- [ ] Whitelist channels di `electron/preload.ts`
  - **Status**: Pending
  - **Notes**: `updaterCheck`, `updaterDownload`, `updaterInstall`, `updaterOnStatus`
- [ ] Register handler di `electron/main.ts`
  - **Status**: Pending

#### 2.2 UI — Update Notification

- [ ] Buat `src/components/updater/UpdateNotification.tsx`
  - **Status**: Pending
  - **Notes**: Banner/dialog di atas app — muncul saat ada update. State: idle → available → downloading (progress bar) → ready → installing
- [ ] Buat `src/hooks/useUpdater.ts`
  - **Status**: Pending
  - **Notes**: Hook untuk subscribe ke updater events via IPC listener
- [ ] Pasang `<UpdateNotification>` di `src/App.tsx`
  - **Status**: Pending

#### 2.3 Update Server

- [ ] Setup GitHub Releases sebagai update server
  - **Status**: Pending
  - **Notes**: Push release tag ke GitHub → `latest.yml` di-generate otomatis oleh electron-builder → electron-updater fetch dari sana
- [ ] Tes update flow: bump version → build → publish → app detect update
  - **Status**: Pending

---

## Arsitektur Auto-Updater

```
Main Process                     Renderer
─────────────────────────────    ─────────────────────────────
autoUpdater.checkForUpdates()    useUpdater hook
  │                                │
  ├─ update-available      ──IPC──► onUpdateAvailable()
  │    { version, releaseNotes }    └─ show banner "Update v1.x tersedia"
  │
  ├─ download-progress     ──IPC──► onDownloadProgress()
  │    { percent, speed }           └─ update progress bar
  │
  ├─ update-downloaded     ──IPC──► onUpdateDownloaded()
  │    { version }                  └─ show "Restart untuk install"
  │
  └─ error                ──IPC──► onUpdateError()
       { message }                  └─ show error toast
```

---

## Konfigurasi Installer NSIS

```
oneClick: false            → user bisa pilih install dir
perMachine: false          → install per-user (tidak butuh admin)
allowElevation: true       → minta UAC jika perlu
createDesktopShortcut: true
createStartMenuShortcut: true
deleteAppDataOnUninstall: false  → data SQLite tetap ada saat uninstall
```

> **Penting**: `deleteAppDataOnUninstall: false` — data transaksi di `%APPDATA%\pos-desktop` tidak ikut terhapus saat uninstall. Ini **by design** untuk UMKM.

---

## Setup GitHub Releases (Update Server)

```
1. Buat repo GitHub: your-org/pos-desktop
2. Di package.json publish block:
   "owner": "your-org",
   "repo": "pos-desktop"
3. Set env var GH_TOKEN saat build:
   $env:GH_TOKEN = "ghp_xxxx"
   npm run electron:build:win -- --publish always
4. electron-builder otomatis:
   - Upload .exe installer ke GitHub Releases
   - Generate latest.yml (manifest untuk auto-updater)
5. App production akan check:
   https://github.com/your-org/pos-desktop/releases/latest
```

---

## File yang Perlu Dibuat / Status

| File                                            | Status    | Keterangan                      |
| ----------------------------------------------- | --------- | ------------------------------- |
| `build-resources/icon.ico`                      | ✅ DONE    | Dibuat via .NET System.Drawing  |
| `build-resources/installer.nsh`                 | ✅ DONE    | Minimal placeholder             |
| `electron-builder.dev.json`                     | ✅ DONE    | Config khusus dev tanpa signing |
| `electron/services/updater/service.ts`          | ⏳ Pending | autoUpdater wrapper             |
| `electron/ipc/updater.ts`                       | ⏳ Pending | IPC handlers                    |
| `src/hooks/useUpdater.ts`                       | ⏳ Pending | React hook                      |
| `src/components/updater/UpdateNotification.tsx` | ⏳ Pending | UI banner/dialog                |

---

## Build Output

```
release/
├── POS Desktop 0.1.0.exe    ← Portable build  (71 MB) ✅ WORKING
└── win-unpacked/
    └── POS Desktop.exe      ← Unpacked dir    (180 MB) ✅ WORKING
```

### Catatan Build
- `winCodeSign` extraction error (`.dylib` symlink) — **tidak mempengaruhi output** karena signing tidak diperlukan untuk dev
- Untuk production NSIS installer: butuh code signing certificate dari Windows
- App berhasil di-launch dari kedua build formats

---

## Blockers

- ✅ `winCodeSign` extraction error — di-solve dengan:
  - `sign: false` + `signAndEditExecutable: false` di `package.json`
  - `publish: null` di `win` block
  - `electron-builder.dev.json` terpisah untuk dev builds
  - `WINCODE_SIGN_SKIP=true` env var
  - Portable & dir builds berhasil tanpa signing

## Next Steps

### Phase 1 (sisanya)
- [ ] NSIS installer untuk production — butuh code signing cert dari Windows
- [ ] Buat app icon yang lebih bagus (optional)

### Phase 2 — Auto-Updater
1. `npm install electron-updater`
2. Buat `electron/services/updater/service.ts`
3. Buat `electron/ipc/updater.ts` + whitelist preload
4. Buat `src/components/updater/UpdateNotification.tsx`
5. Buat `src/hooks/useUpdater.ts`
6. Pasang di `App.tsx`
7. Test update flow dengan bump version + GitHub Releases
