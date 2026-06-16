import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findUserByPin, findUserByEmail, findUserById, resetAdminPin as doResetAdminPin, hashPin, type User, type AuthResult } from './repo.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'pos-desktop-dev-secret-change-in-production';
const JWT_EXPIRY = '24h';

function generateToken(user: { id: string }): string {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export async function loginPin(pin: string): Promise<AuthResult> {
  const user = await findUserByPin(pin);
  if (!user) throw new Error('AUTH_001');
  if (!user.isActive) throw new Error('AUTH_003');
  return { user, token: generateToken(user) };
}

export async function loginPassword(email: string, password: string): Promise<AuthResult> {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) throw new Error('AUTH_002');
  if (!user.isActive) throw new Error('AUTH_003');
  return { user, token: generateToken(user) };
}

export async function validateToken(token: string): Promise<User | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    return await findUserById(payload.sub);
  } catch { return null; }
}

export async function resetAdminPin(): Promise<{ ok: boolean; message?: string }> {
  return doResetAdminPin();
}

export async function verifyAdminPin(pin: string): Promise<{ ok: boolean; userId?: string; role?: string }> {
  const result = await findAdminByPin(pin);
  if (!result) return { ok: false };
  return { ok: true, userId: result.userId, role: result.role };
}
