import { ipcMain, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { checkForUpdates, downloadUpdate, installUpdate } from './service.ts';

export function registerUpdaterHandlers(mainWindow: BrowserWindow): void {
  function send(event: string, data?: unknown) {
    if (!mainWindow.isDestroyed()) mainWindow.webContents.send(event, data);
  }

  autoUpdater.on('checking-for-update', () => send('updater:checking'));
  autoUpdater.on('update-available', (info) => send('updater:available', info));
  autoUpdater.on('update-not-available', (info) => send('updater:not-available', info));
  autoUpdater.on('download-progress', (progress) => send('updater:progress', progress));
  autoUpdater.on('update-downloaded', (info) => send('updater:downloaded', info));
  autoUpdater.on('error', (err) => send('updater:error', err.message));

  ipcMain.handle('updater:check', async () => checkForUpdates());
  ipcMain.handle('updater:download', async () => downloadUpdate());
  ipcMain.handle('updater:install', () => installUpdate());
}
