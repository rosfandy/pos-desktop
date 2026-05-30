import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { rowToUser } from './repo.js';
import type { User, AuthResult } from './repo.js';
import { getDb } from '../../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pos-desktop-dev-secret-change-in-production';
const JWT_EXPIRY = '24h';

/**
 * Authenticates a user by 6-digit PIN.
 * @throws {Error} AUTH_001 if PIN is invalid, AUTH_003 if user is inactive
 */
export async function loginPin(pin: string): Promise<AuthResult> {
  const db = await getDb();
  const allUsers = db.exec('SELECT id, name, email, pin, password_hash, role, is_active, created_at FROM users');

  if (!allUsers[0]?.values.length) {
    throw new Error('AUTH_001');
  }

  const cols = allUsers[0].columns;
  let matchedUser: User | null = null;

  for (const rawRow of allUsers[0].values) {
    const row = rawRow as unknown[];
    const pinIdx = cols.indexOf('pin');
    const pinHash = row[pinIdx];
    if (pinHash && (await bcrypt.compare(pin, String(pinHash)))) {
      matchedUser = rowToUser(cols, row);
      break;
    }
  }

  if (!matchedUser) {
    throw new Error('AUTH_001');
  }

  if (!matchedUser.isActive) {
    throw new Error('AUTH_003');
  }

  const token = generateToken(matchedUser);
  return { user: matchedUser, token };
}

/**
 * Authenticates a user by email + password.
 * @throws {Error} AUTH_002 if credentials are invalid, AUTH_003 if inactive
 */
export async function loginPassword(email: string, password: string): Promise<AuthResult> {
  const db = await getDb();
  const allRows = db.exec(
    `SELECT id, name, email, pin, password_hash, role, is_active, created_at FROM users WHERE email = '${email.replace(/'/g, "''")}' LIMIT 1`
  );

  if (!allRows[0]?.values.length) {
    throw new Error('AUTH_002');
  }

  const cols = allRows[0].columns;
  const userRow = allRows[0].values[0] as unknown[];
  const user = rowToUser(cols, userRow);

  if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new Error('AUTH_002');
  }

  if (!user.isActive) {
    throw new Error('AUTH_003');
  }

  const token = generateToken(user);
  return { user, token };
}

/**
 * Validates a JWT token and returns the user, or null if invalid/expired.
 */
export async function validateToken(token: string): Promise<User | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const db = await getDb();
    const rows = db.exec(
      `SELECT id, name, email, pin, password_hash, role, is_active, created_at FROM users WHERE id = '${payload.sub}'`
    );

    if (!rows[0]?.values.length) return null;
    const cols = rows[0].columns;
    return rowToUser(cols, rows[0].values[0] as unknown[]);
  } catch {
    return null;
  }
}

/**
 * Verifies a PIN for a specific user (admin/manager authorization check).
 * Returns true if the PIN matches an active admin or manager user.
 */
export async function verifyAdminPin(pin: string): Promise<{ ok: boolean; userId?: string; role?: string }> {
  const db = await getDb();
  const rows = db.exec(`SELECT id, name, pin, role, is_active FROM users WHERE role IN ('admin','manager') AND is_active = 1`);
  if (!rows[0]?.values.length) return { ok: false };

  const cols = rows[0].columns;
  for (const rawRow of rows[0].values) {
    const row = rawRow as unknown[];
    const pinHash = row[cols.indexOf('pin')];
    if (pinHash && (await bcrypt.compare(pin, String(pinHash)))) {
      return {
        ok: true,
        userId: String(row[cols.indexOf('id')]),
        role: String(row[cols.indexOf('role')]),
      };
    }
  }
  return { ok: false };
}

function generateToken(user: { id: string }): string {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}
