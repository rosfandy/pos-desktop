import { ipcMain } from 'electron';
import { loginPin, loginPassword, validateToken, verifyAdminPin, resetAdminPin } from './service.ts';

// ─── Error helpers ───────────────────────────────────────────────────────────

const AuthError: Record<string, { code: string; message: string }> = {
  AUTH_001: { code: 'AUTH_001', message: 'PIN tidak valid' },
  AUTH_002: { code: 'AUTH_002', message: 'Email atau password salah' },
  AUTH_003: { code: 'AUTH_003', message: 'Akun tidak aktif, hubungi admin' },
};

function authError(code: string): { code: string; message: string } {
  return AuthError[code] || { code: 'AUTH_UNKNOWN', message: 'Terjadi kesalahan' };
}

// ─── Handlers ────────────────────────────────────────────────────────────────

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:login', async (_event, credentials) => {
    try {
      const { pin, email, password } = credentials;

      if (pin) {
        const result = await loginPin(pin);
        return { ok: true, data: result };
      }

      if (email && password) {
        const result = await loginPassword(email, password);
        return { ok: true, data: result };
      }

      return { ok: false, error: { code: 'AUTH_002', message: 'Email atau password salah' } };
    } catch (err) {
      const code = (err as Error).message;
      if (code === 'AUTH_001') return { ok: false, error: authError('AUTH_001') };
      if (code === 'AUTH_003') return { ok: false, error: authError('AUTH_003') };
      if (code === 'AUTH_002') return { ok: false, error: authError('AUTH_002') };
      console.error('[auth:login]', err);
      return { ok: false, error: { code: 'AUTH_002', message: 'Email atau password salah' } };
    }
  });

  ipcMain.handle('auth:logout', async () => {
    return { ok: true };
  });

  ipcMain.handle('auth:me', async (_event, token?: string) => {
    if (!token) return { ok: true, data: null };

    try {
      const user = await validateToken(token);
      return { ok: true, data: user };
    } catch {
      return { ok: true, data: null };
    }
  });

  ipcMain.handle('auth:verifyPin', async (_event, pin: string) => {
    try {
      const result = await verifyAdminPin(pin);
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'AUTH_UNKNOWN', message: err.message } };
    }
  });

  ipcMain.handle('auth:resetAdminPin', async () => {
    try {
      const result = await resetAdminPin();
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'AUTH_RESET', message: err.message || 'Gagal reset PIN' } };
    }
  });
}
