import { ipcMain, BrowserWindow, app } from 'electron';
import { autoUpdater } from 'electron-updater';

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

export function registerUpdaterHandlers(mainWindow: BrowserWindow): void {
  // Send update status to renderer
  function send(event: string, data?: unknown) {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(event, data);
    }
  }

  autoUpdater.on('checking-for-update', () => {
    send('updater:checking');
  });

  autoUpdater.on('update-available', (info) => {
    send('updater:available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    send('updater:not-available', info);
  });

  autoUpdater.on('download-progress', (progress) => {
    send('updater:progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    send('updater:downloaded', info);
  });

  autoUpdater.on('error', (err) => {
    send('updater:error', err.message);
  });

  // IPC handlers from renderer
  ipcMain.handle('updater:check', async () => {
    if (!app.isPackaged) {
      return { ok: false, error: 'Update hanya tersedia di aplikasi terinstall' };
    }
    try {
      await autoUpdater.checkForUpdates();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('updater:download', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall();
    return { ok: true };
  });
}
