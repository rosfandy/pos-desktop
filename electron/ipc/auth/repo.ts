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
  if (!rows[0]?.values.length) {
    console.log('[AUTH][repo] findUserByPin: NO USERS IN DB');
    return null;
  }
  const cols = rows[0].columns;
  console.log(`[AUTH][repo] findUserByPin: checking ${rows[0].values.length} users`);
  for (const rawRow of rows[0].values) {
    const row = rawRow as unknown[];
    const pinHash = row[cols.indexOf('pin')];
    const match = pinHash && await bcrypt.compare(pin, String(pinHash));
    if (match) {
      console.log('[AUTH][repo] findUserByPin: MATCH found, userId:', row[cols.indexOf('id')]);
      return rowToUser(cols, row);
    }
  }
  console.log('[AUTH][repo] findUserByPin: NO MATCH for provided PIN');
  return null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const rows = db.exec(
    `SELECT id, name, email, pin, password_hash, role, is_active, created_at FROM users WHERE email = '${esc(email)}' LIMIT 1`
  );
  if (!rows[0]?.values.length) {
    console.log(`[AUTH][repo] findUserByEmail: user not found for email="${email}"`);
    return null;
  }
  console.log(`[AUTH][repo] findUserByEmail: found user id=${rows[0].values[0][cols.indexOf('id')]} email="${email}"`);
  return rowToUser(rows[0].columns, rows[0].values[0] as unknown[]);
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await getDb();
  const rows = db.exec(`SELECT id, name, email, pin, password_hash, role, is_active, created_at FROM users WHERE id = '${esc(id)}'`);
  if (!rows[0]?.values.length) {
    console.log(`[AUTH][repo] findUserById: user not found id=${id}`);
    return null;
  }
  console.log(`[AUTH][repo] findUserById: found user id=${id}`);
  return rowToUser(rows[0].columns, rows[0].values[0] as unknown[]);
}

export async function resetAdminPin(): Promise<{ ok: boolean; message?: string }> {
  const db = await getDb();
  const newPinHash = await bcrypt.hash('123456', 10);
  db.run(`UPDATE users SET pin = '${newPinHash.replace(/'/g, "''")}' WHERE role IN ('admin','manager') AND is_active = 1`);
  const check = db.exec(`SELECT COUNT(*) as cnt FROM users WHERE role IN ('admin','manager') AND is_active = 1`);
  const updated = check[0]?.values[0]?.[0] ?? 0;
  console.log(`[AUTH][repo] resetAdminPin: updated ${updated} admin/manager user(s)`);
  return { ok: true, message: 'PIN admin berhasil direset ke 123456' };
}

export async function findAdminByPin(pin: string): Promise<{ userId: string; role: string } | null> {
  const db = await getDb();
  const rows = db.exec(`SELECT id, pin, role FROM users WHERE role IN ('admin','manager') AND is_active = 1`);
  if (!rows[0]?.values.length) {
    console.log('[AUTH][repo] findAdminByPin: no admin/manager users found');
    return null;
  }
  const cols = rows[0].columns;
  console.log(`[AUTH][repo] findAdminByPin: checking ${rows[0].values.length} admin/manager users`);
  for (const rawRow of rows[0].values) {
    const row = rawRow as unknown[];
    const pinHash = row[cols.indexOf('pin')];
    const match = pinHash && await bcrypt.compare(pin, String(pinHash));
    if (match) {
      console.log('[AUTH][repo] findAdminByPin: MATCH found, userId:', row[cols.indexOf('id')]);
      return { userId: String(row[cols.indexOf('id')]), role: String(row[cols.indexOf('role')]) };
    }
  }
  console.log('[AUTH][repo] findAdminByPin: NO MATCH for provided PIN');
  return null;
}
