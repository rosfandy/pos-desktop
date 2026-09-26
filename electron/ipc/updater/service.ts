import { autoUpdater } from 'electron-updater';
import { app } from 'electron';

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Konfigurasi feed update secara eksplisit agar tidak bergantung pada
// file app-update.yml (electron-builder terkadang tidak menghasilkannya).
// primary: setFeedURL; fallback: app-update.yml via extraResources.
if (app.isPackaged) {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'rosfandy',
    repo: 'pos-desktop',
    updaterCacheDirName: 'pos-desktop-updater',
  });
}

export async function checkForUpdates(): Promise<{ ok: boolean; error?: string }> {
  if (!app.isPackaged) {
    return { ok: false, error: 'Update hanya tersedia di aplikasi terinstall' };
  }
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function downloadUpdate(): Promise<{ ok: boolean; error?: string }> {
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export function installUpdate(): { ok: boolean } {
  // isForceRunAfter=true: app otomatis jalan lagi setelah installer selesai.
  // NSIS macro customCheckAppRunning (build-resources/installer.nsh) yang
  // menutup proses app saat installer berjalan, jadi tidak ada prompt manual.
  autoUpdater.quitAndInstall(false, true);
  return { ok: true };
}
