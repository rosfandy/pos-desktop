import { getDb } from '../../db/index.ts';
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

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

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

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

export async function findUserByPin(pin: string): Promise<User | null> {
  const db = await getDb();
  const rows = db.exec('SELECT id, name, email, pin, password_hash, role, is_active, created_at FROM users');
  if (!rows[0]?.values.length) return null;
  const cols = rows[0].columns;
  for (const rawRow of rows[0].values) {
    const row = rawRow as unknown[];
    const pinHash = row[cols.indexOf('pin')];
    if (pinHash && await bcrypt.compare(pin, String(pinHash))) {
      return rowToUser(cols, row);
    }
  }
  return null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const rows = db.exec(
    `SELECT id, name, email, pin, password_hash, role, is_active, created_at FROM users WHERE email = '${esc(email)}' LIMIT 1`
  );
  if (!rows[0]?.values.length) return null;
  return rowToUser(rows[0].columns, rows[0].values[0] as unknown[]);
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await getDb();
  const rows = db.exec(`SELECT id, name, email, pin, password_hash, role, is_active, created_at FROM users WHERE id = '${esc(id)}'`);
  if (!rows[0]?.values.length) return null;
  return rowToUser(rows[0].columns, rows[0].values[0] as unknown[]);
}

export async function resetAdminPin(): Promise<{ ok: boolean; message?: string }> {
  const db = await getDb();
  const newPinHash = await bcrypt.hash('123456', 10);
  db.run(`UPDATE users SET pin = '${newPinHash.replace(/'/g, "''")}' WHERE role IN ('admin','manager') AND is_active = 1`);
  return { ok: true, message: 'PIN admin berhasil direset ke 123456' };
}

export async function findAdminByPin(pin: string): Promise<{ userId: string; role: string } | null> {
  const db = await getDb();
  const rows = db.exec(`SELECT id, pin, role FROM users WHERE role IN ('admin','manager') AND is_active = 1`);
  if (!rows[0]?.values.length) return null;
  const cols = rows[0].columns;
  for (const rawRow of rows[0].values) {
    const row = rawRow as unknown[];
    const pinHash = row[cols.indexOf('pin')];
    if (pinHash && await bcrypt.compare(pin, String(pinHash))) {
      return { userId: String(row[cols.indexOf('id')]), role: String(row[cols.indexOf('role')]) };
    }
  }
  return null;
}
