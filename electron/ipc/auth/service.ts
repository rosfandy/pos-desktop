import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from '../../db/index.ts';
import { rowToUser, type User, type AuthResult } from './repo.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'pos-desktop-dev-secret-change-in-production';
const JWT_EXPIRY = '24h';

export async function loginPin(pin: string): Promise<AuthResult> {
  const db = await getDb();
  const allUsers = db.exec('SELECT id, name, email, pin, password_hash, role, is_active, created_at FROM users');
  if (!allUsers[0]?.values.length) throw new Error('AUTH_001');
  const cols = allUsers[0].columns;
  for (const rawRow of allUsers[0].values) {
    const row = rawRow as unknown[];
    const pinHash = row[cols.indexOf('pin')];
    if (pinHash && (await bcrypt.compare(pin, String(pinHash)))) {
      const user = rowToUser(cols, row);
      if (!user.isActive) throw new Error('AUTH_003');
      return { user, token: generateToken(user) };
    }
  }
  throw new Error('AUTH_001');
}

export async function loginPassword(email: string, password: string): Promise<AuthResult> {
  const db = await getDb();
  const allRows = db.exec(
    `SELECT id, name, email, pin, password_hash, role, is_active, created_at FROM users WHERE email = '${email.replace(/'/g, "''")}' LIMIT 1`
  );
  if (!allRows[0]?.values.length) throw new Error('AUTH_002');
  const cols = allRows[0].columns;
  const user = rowToUser(cols, allRows[0].values[0] as unknown[]);
  if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) throw new Error('AUTH_002');
  if (!user.isActive) throw new Error('AUTH_003');
  return { user, token: generateToken(user) };
}

export async function validateToken(token: string): Promise<User | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const db = await getDb();
    const rows = db.exec(`SELECT id, name, email, pin, password_hash, role, is_active, created_at FROM users WHERE id = '${payload.sub}'`);
    if (!rows[0]?.values.length) return null;
    return rowToUser(rows[0].columns, rows[0].values[0] as unknown[]);
  } catch { return null; }
}

export async function verifyAdminPin(pin: string): Promise<{ ok: boolean; userId?: string; role?: string }> {
  const db = await getDb();
  const rows = db.exec(`SELECT id, name, pin, role, is_active FROM users WHERE role IN ('admin','manager') AND is_active = 1`);
  if (!rows[0]?.values.length) return { ok: false };
  const cols = rows[0].columns;
  for (const rawRow of rows[0].values) {
    const row = rawRow as unknown[];
    const pinHash = row[cols.indexOf('pin')];
    if (pinHash && (await bcrypt.compare(pin, String(pinHash)))) {
      return { ok: true, userId: String(row[cols.indexOf('id')]), role: String(row[cols.indexOf('role')]) };
    }
  }
  return { ok: false };
}

function generateToken(user: { id: string }): string {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}
