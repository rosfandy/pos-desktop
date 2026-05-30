import { getSetting, setSetting, getAllSettings } from './repo.js';

// ── Settings Service ─────────────────────────────────────────────────────────

export async function getSettingValue(key: string): Promise<string | null> {
  return getSetting(key);
}

export async function setSettingValue(key: string, value: string): Promise<void> {
  if (!key || key.trim().length === 0) {
    throw new Error('SETTINGS_001: Key tidak boleh kosong');
  }
  await setSetting(key, value);
}

export async function getAllSettingsValues(): Promise<Record<string, string>> {
  return getAllSettings();
}
