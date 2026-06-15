import { ipcMain, dialog } from 'electron';
import { backupToFile, restoreFromFile } from './service.ts';

export function registerBackupHandlers(): void {
  // backup:create — open save dialog, then backup DB to selected file
  ipcMain.handle('backup:create', async () => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: `backup-${new Date().toISOString().slice(0, 10)}.db`,
        filters: [{ name: 'Database Backup', extensions: ['db'] }],
      });

      if (result.canceled || !result.filePath) {
        return { ok: false, error: { code: 'BACKUP_001', message: 'Dibatalkan' } };
      }

      await backupToFile(result.filePath);
      return { ok: true, data: { path: result.filePath } };
    } catch (err: any) {
      return { ok: false, error: { code: 'BACKUP_002', message: err.message } };
    }
  });

  // backup:restore — open open dialog, validate, then restore
  ipcMain.handle('backup:restore', async () => {
    try {
      const result = await dialog.showOpenDialog({
        filters: [{ name: 'Database Backup', extensions: ['db'] }],
        properties: ['openFile'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { ok: false, error: { code: 'BACKUP_001', message: 'Dibatalkan' } };
      }

      await restoreFromFile(result.filePaths[0]);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: { code: 'BACKUP_003', message: err.message } };
    }
  });
}
