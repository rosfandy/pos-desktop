import { ipcMain } from 'electron';
import { getSettingValue, setSettingValue, getAllSettingsValues } from '../services/settings/service.ts';

// ── Settings IPC Handlers ────────────────────────────────────────────────────

export function registerSettingsHandlers() {
  // settings:getAll → { ok: true, data: Record<string, string> }
  ipcMain.handle('settings:getAll', async () => {
    try {
      const data = await getAllSettingsValues();
      return { ok: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat pengaturan';
      return { ok: false, error: { code: 'SETTINGS_002', message } };
    }
  });

  // settings:get → { ok: true, data: string | null }
  ipcMain.handle('settings:get', async (_, key: string) => {
    try {
      const value = await getSettingValue(key);
      return { ok: true, data: value };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal membaca pengaturan';
      return { ok: false, error: { code: 'SETTINGS_001', message } };
    }
  });

  // settings:set → { ok: true }
  ipcMain.handle('settings:set', async (_, key: string, value: string) => {
    try {
      await setSettingValue(key, value);
      return { ok: true, data: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan pengaturan';
      return { ok: false, error: { code: 'SETTINGS_003', message } };
    }
  });

  // settings:getTheme → { ok: true, data: 'light' | 'dark' }
  ipcMain.handle('settings:getTheme', async () => {
    try {
      const value = await getSettingValue('theme');
      return { ok: true, data: (value as 'light' | 'dark') || 'light' };
    } catch {
      return { ok: true, data: 'light' };
    }
  });

  // settings:setTheme → { ok: true }
  ipcMain.handle('settings:setTheme', async (_, theme: 'light' | 'dark') => {
    try {
      await setSettingValue('theme', theme);
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan tema';
      return { ok: false, error: { code: 'SETTINGS_004', message } };
    }
  });
}
