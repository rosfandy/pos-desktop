import { ipcMain } from 'electron';
import {
  createSaleTransaction,
  holdTransaction,
  retrieveHeldTransaction,
  listHeldTransactions,
  voidTransaction,
  refundTransaction,
  bulkDeleteHeldTransactions,
  TRANS_ERR,
} from '../services/transaction/service.ts';
import { listTransactions } from '../services/transaction/repo.js';

// ── Error codes ────────────────────────────────────────────────────────────────

const TRANS_ERROR: Record<string, { code: string; message: string }> = {
  TRANS_001: { code: 'TRANS_001', message: 'Stok tidak mencukupi' },
  TRANS_002: { code: 'TRANS_002', message: 'Jumlah pembayaran kurang' },
  TRANS_003: { code: 'TRANS_003', message: 'Transaksi sudah dibatalkan' },
  TRANS_004: { code: 'TRANS_004', message: 'Buka shift terlebih dahulu' },
};

function transError(code: string): { code: string; message: string } {
  return TRANS_ERROR[code] || { code: 'TRANS_UNKNOWN', message: 'Terjadi kesalahan' };
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export function registerTransactionHandlers(): void {
  // Create sale transaction
  ipcMain.handle('transaction:create', async (_event, dto: any) => {
    try {
      const result = await createSaleTransaction(dto);
      return { ok: true, data: result };
    } catch (err: any) {
      console.error('[transaction:create] ERROR', err?.message || err, err?.stack);
      const msg = err?.message || 'Terjadi kesalahan';
      return { ok: false, error: { code: err?.code || 'TRANS_UNKNOWN', message: msg } };
    }
  });

  // Get transaction by id
  ipcMain.handle('transaction:get', async (_event, id: string) => {
    try {
      const result = await retrieveHeldTransaction(id);
      if (!result) return { ok: false, error: { code: 'TRANS_NOT_FOUND', message: 'Transaksi tidak ditemukan' } };
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'TRANS_UNKNOWN', message: err.message } };
    }
  });

  // List transactions
  ipcMain.handle('transaction:list', async (_event, filters?: any) => {
    try {
      const result = await listTransactions(filters);
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'TRANS_UNKNOWN', message: err.message } };
    }
  });

  // Hold bill
  ipcMain.handle('transaction:hold', async (_event, dto: any) => {
    try {
      const result = await holdTransaction(dto);
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'TRANS_UNKNOWN', message: err.message } };
    }
  });

  // Unhold / retrieve bill
  ipcMain.handle('transaction:unhold', async (_event, id: string) => {
    try {
      const result = await retrieveHeldTransaction(id);
      if (!result) return { ok: false, error: { code: 'TRANS_NOT_FOUND', message: 'Bill tidak ditemukan' } };
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'TRANS_UNKNOWN', message: err.message } };
    }
  });

  // List held bills
  ipcMain.handle('transaction:listHeld', async () => {
    try {
      const result = await listHeldTransactions();
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'TRANS_UNKNOWN', message: err.message } };
    }
  });

  // Void transaction
  ipcMain.handle('transaction:void', async (_event, id: string, reason: string) => {
    try {
      const result = await voidTransaction(id, reason);
      return { ok: true, data: result };
    } catch (err: any) {
      const code = err.code || 'TRANS_UNKNOWN';
      return { ok: false, error: transError(code) };
    }
  });

  // Refund transaction
  ipcMain.handle('transaction:refund', async (_event, id: string, items?: any[]) => {
    try {
      const result = await refundTransaction(id, items);
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'TRANS_UNKNOWN', message: err.message } };
    }
  });

  // Bulk delete held bills
  ipcMain.handle('transaction:bulkDeleteHeld', async (_event, ids: string[]) => {
    try {
      const results = await bulkDeleteHeldTransactions(ids);
      return { ok: true, data: results };
    } catch (err: any) {
      return { ok: false, error: { code: 'TRANS_UNKNOWN', message: err.message } };
    }
  });
}
