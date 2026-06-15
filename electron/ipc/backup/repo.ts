import { getDb, closeDb } from '../../db/index.ts';
import { app } from 'electron';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, statSync } from 'node:fs';

const DB_FILENAME = 'pos.db';

function getDataDir(): string {
  return app.getPath('userData');
}

function getDbPath(): string {
  return join(getDataDir(), DB_FILENAME);
}

function validateSqliteHeader(buffer: Buffer): boolean {
  const header = buffer.slice(0, 16);
  return header.toString('hex').startsWith('53514c697465');
}

export async function backupToFile(targetPath: string): Promise<void> {
  const db = await getDb();
  const dbPath = getDbPath();
  const data = db.export();
  writeFileSync(dbPath, Buffer.from(data));
  const targetDir = dirname(targetPath);
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
  copyFileSync(dbPath, targetPath);
  if (!existsSync(targetPath) || (statSync(targetPath).size === 0)) throw new Error('File backup kosong');
}

export async function restoreFromFile(sourcePath: string): Promise<void> {
  if (!existsSync(sourcePath)) throw new Error('File backup tidak ditemukan');
  const buffer = readFileSync(sourcePath);
  if (!validateSqliteHeader(buffer)) throw new Error('File bukan database SQLite yang valid');
  const dbPath = getDbPath();
  await closeDb();
  copyFileSync(sourcePath, dbPath);
  await getDb();
}
