import { autoUpdater } from 'electron-updater';
import { app } from 'electron';

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

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
  autoUpdater.quitAndInstall();
  return { ok: true };
}
