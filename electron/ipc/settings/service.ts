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
import { getDb } from '../../db/index.js';
import type { Database as SqlJsDatabase } from 'sql.js';

// ── Settings Table ───────────────────────────────────────────────────────────
// key-value store with TEXT values (JSON-stringified for non-string values)

const TABLE_NAME = 'settings';

async function openDb(): Promise<SqlJsDatabase> {
  return getDb();
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await openDb();
  const rows = db.exec(`SELECT value FROM ${TABLE_NAME} WHERE key = '${key.replace(/'/g, "''")}'`);
  if (!rows[0] || rows[0].values.length === 0) return null;
  return String(rows[0].values[0][0]);
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await openDb();
  db.run(
    `INSERT INTO ${TABLE_NAME} (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await openDb();
  const rows = db.exec(`SELECT key, value FROM ${TABLE_NAME}`);
  const result: Record<string, string> = {};
  if (!rows[0]) return result;
  for (const row of rows[0].values) {
    result[String(row[0])] = String(row[1]);
  }
  return result;
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await openDb();
  db.run(`DELETE FROM ${TABLE_NAME} WHERE key = ?`, [key]);
}

