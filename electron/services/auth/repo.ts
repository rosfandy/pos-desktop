import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import bcrypt from 'bcryptjs';

export interface AuthResult {
  user: User;
  token: string;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  pin: string | null;
  passwordHash: string | null;
  role: 'admin' | 'manager' | 'cashier';
  isActive: boolean;
  createdAt: string;
}

/**
 * Opens (or creates) the SQLite database.
 */
export async function openDb(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();
  const dbPath = join(process.cwd(), 'data', 'pos.db');
  return existsSync(dbPath)
    ? new SQL.Database(readFileSync(dbPath))
    : new SQL.Database();
}

/**
 * Saves the in-memory DB to disk.
 */
export async function saveDb(db: SqlJsDatabase): Promise<void> {
  const dbPath = join(process.cwd(), 'data', 'pos.db');
  writeFileSync(dbPath, Buffer.from(db.export()));
}

/**
 * Converts a raw sql.js row to a typed User object.
 */
export function rowToUser(cols: string[], row: unknown[]): User {
  const get = (col: string) => {
    const i = cols.indexOf(col);
    return i >= 0 ? row[i] ?? null : null;
  };

  const isActive = get('is_active');

  return {
    id: String(get('id')),
    name: String(get('name')),
    email: get('email') != null ? String(get('email')) : null,
    pin: get('pin') != null ? String(get('pin')) : null,
    passwordHash: get('password_hash') != null ? String(get('password_hash')) : null,
    role: String(get('role')) as User['role'],
    isActive: isActive === 1 || isActive === '1' || isActive === true || isActive === 'true',
    createdAt: String(get('created_at') ?? ''),
  };
}

/**
 * Hashes a PIN using bcrypt (salt rounds = 12).
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}
