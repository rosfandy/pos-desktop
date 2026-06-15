import { ipcMain } from 'electron';
import { openShift, closeShift, getCurrentShift } from './service.ts';
import { getById, listShifts, getShiftSummary } from './service.ts';
import type { ShiftFilter } from './service.ts';

export function registerShiftHandlers(): void {
  // ── Open shift ──────────────────────────────────────────────────────────
  ipcMain.handle('shift:open', async (_event, data: { openingCash: number; userId: string }) => {
    try {
      const shift = await openShift(data);
      return { ok: true, data: shift };
    } catch (err: any) {
      return { ok: false, error: { code: err.message, message: getErrorMessage(err.message) } };
    }
  });

  // ── Close shift ─────────────────────────────────────────────────────────
  ipcMain.handle('shift:close', async (_event, data: { closingCash: number; shiftId: string; notes?: string }) => {
    try {
      const shift = await closeShift(data);
      return { ok: true, data: shift };
    } catch (err: any) {
      return { ok: false, error: { code: err.message, message: getErrorMessage(err.message) } };
    }
  });

  // ── Get current open shift ──────────────────────────────────────────────
  ipcMain.handle('shift:current', async (_event, userId: string) => {
    try {
      const shift = await getCurrentShift(userId);
      return { ok: true, data: shift };
    } catch (err: any) {
      return { ok: false, error: { code: err.message, message: getErrorMessage(err.message) } };
    }
  });

  // ── Get shift by ID ─────────────────────────────────────────────────────
  ipcMain.handle('shift:get', async (_event, id: string) => {
    try {
      const shift = await getById(id);
      return { ok: true, data: shift };
    } catch (err: any) {
      return { ok: false, error: { code: err.message, message: getErrorMessage(err.message) } };
    }
  });

  // ── List shifts ─────────────────────────────────────────────────────────
  ipcMain.handle('shift:list', async (_event, filter?: ShiftFilter) => {
    try {
      const shifts = await listShifts(filter);
      return { ok: true, data: shifts };
    } catch (err: any) {
      return { ok: false, error: { code: err.message, message: getErrorMessage(err.message) } };
    }
  });

  // ── Get shift summary ───────────────────────────────────────────────────
  ipcMain.handle('shift:summary', async (_event, shiftId: string) => {
    try {
      const shift = await getById(shiftId);
      if (!shift) {
        return { ok: false, error: { code: 'SHIFT_002', message: 'Shift tidak ditemukan' } };
      }
      const summary = await getShiftSummary(shiftId);
      return {
        ok: true,
        data: {
          shiftId: shift.id,
          ...summary,
          openingCash: shift.openingCash,
          closingCash: shift.closingCash,
          expectedCash: shift.expectedCash,
          discrepancy: shift.discrepancy,
        },
      };
    } catch (err: any) {
      return { ok: false, error: { code: err.message, message: getErrorMessage(err.message) } };
    }
  });
}

// ─── Error messages ──────────────────────────────────────────────────────────

function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    SHIFT_001: 'Anda sudah memiliki shift yang aktif',
    SHIFT_002: 'Tidak ada shift yang bisa ditutup',
    SHIFT_003: 'Jumlah uang tidak valid',
  };
  return messages[code] || code;
}
