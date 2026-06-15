import { ipcMain } from 'electron';
import {
  listCustomers,
  getCustomerById,
  getCustomerByPhone,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
  addPoints,
  redeemPoints,
  recordTransactionPoints,
} from './service.ts';
import { calculatePoints, calculateTier } from './service.ts';
import { getTransactionsByCustomerId } from '../transaction/service.ts';
import type { CustomerTransactionRow } from '../transaction/service.ts';
import { exportCustomers } from './service.ts';
import type { CustomerExportParams } from './service.ts';
import { previewImportFromBuffer, commitImport } from './service.ts';
import type { CustomerImportRow } from './service.ts';

function ok<T>(data: T) { return { ok: true as const, data }; }
function fail(message: string, code = 'ERR') { return { ok: false as const, error: { code, message } }; }

export function registerCustomerHandlers() {
  ipcMain.handle('customer:list', async (_e, filter?: { search?: string }) => {
    try {
      const data = await listCustomers(filter);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_LIST', message: err?.message || 'Gagal memuat pelanggan' } };
    }
  });

  ipcMain.handle('customer:get', async (_e, id: string) => {
    try {
      const data = await getCustomerById(id);
      if (!data) return { ok: false, error: { code: 'CUST_003', message: 'Pelanggan tidak ditemukan' } };
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_GET', message: err?.message || 'Gagal memuat pelanggan' } };
    }
  });

  ipcMain.handle('customer:getByPhone', async (_e, phone: string) => {
    try {
      const data = await getCustomerByPhone(phone);
      if (!data) return { ok: false, error: { code: 'CUST_003', message: 'Pelanggan tidak ditemukan' } };
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_GET', message: err?.message || 'Gagal memuat pelanggan' } };
    }
  });

  ipcMain.handle('customer:create', async (_e, input: { name: string; phone?: string; email?: string; address?: string; points?: number }) => {
    try {
      const result = await createCustomer({
        name: input.name,
        phone: input.phone || undefined,
        email: input.email || undefined,
        address: input.address || undefined,
        points: input.points,
      });
      if ('error' in result) return { ok: false, error: { code: 'CUST_CREATE', message: result.error } };
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_CREATE', message: err?.message || 'Gagal membuat pelanggan' } };
    }
  });

  ipcMain.handle('customer:update', async (_e, id: string, input: Partial<{ name: string; phone: string; email: string; address: string; points: number }>) => {
    try {
      const result = await updateCustomer(id, input);
      if ('error' in result) return { ok: false, error: { code: 'CUST_UPDATE', message: result.error } };
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_UPDATE', message: err?.message || 'Gagal memperbarui pelanggan' } };
    }
  });

  ipcMain.handle('customer:delete', async (_e, id: string) => {
    try {
      const result = await deleteCustomer(id);
      if (!result.success) return { ok: false, error: { code: 'CUST_DELETE', message: result.error || 'Gagal menghapus pelanggan' } };
      return { ok: true, data: { success: true } };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_DELETE', message: err?.message || 'Gagal menghapus pelanggan' } };
    }
  });

  ipcMain.handle('customer:bulkDelete', async (_e, ids: string[]) => {
    try {
      const result = await bulkDeleteCustomers(ids);
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_BULK_DELETE', message: err?.message || 'Gagal menghapus massal' } };
    }
  });

  ipcMain.handle('customer:addPoints', async (_e, id: string, points: number) => {
    try {
      const result = await addPoints(id, points);
      if ('error' in result) return { ok: false, error: { code: 'CUST_POINTS', message: result.error } };
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_POINTS', message: err?.message || 'Gagal menambahkan poin' } };
    }
  });

  ipcMain.handle('customer:redeemPoints', async (_e, id: string, points: number) => {
    try {
      const result = await redeemPoints(id, points);
      if ('error' in result) return { ok: false, error: { code: 'CUST_REDEEM', message: result.error } };
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_REDEEM', message: err?.message || 'Gagal menukar poin' } };
    }
  });

  ipcMain.handle('customer:calculatePoints', async (_e, amountCents: number, tier: string) => {
    try {
      const points = calculatePoints(amountCents, tier as any);
      return { ok: true, data: { points } };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_CALC', message: err?.message || 'Gagal menghitung poin' } };
    }
  });

  ipcMain.handle('customer:calculateTier', async (_e, totalSpent: number) => {
    try {
      const tier = calculateTier(totalSpent);
      return { ok: true, data: { tier } };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_CALC', message: err?.message || 'Gagal menghitung tier' } };
    }
  });

  ipcMain.handle('customer:transactions', async (_e, customerId: string, limit?: number) => {
    try {
      const data = await getTransactionsByCustomerId(customerId, limit || 50);
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_TRANS', message: err?.message || 'Gagal memuat riwayat transaksi' } };
    }
  });

  ipcMain.handle('customer:recordTransaction', async (_e, customerId: string, transactionTotalCents: number) => {
    try {
      const result = await recordTransactionPoints(customerId, transactionTotalCents);
      if ('error' in result) return { ok: false, error: { code: 'CUST_POINTS', message: result.error } };
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CUST_POINTS', message: err?.message || 'Gagal update poin' } };
    }
  });

  // ── Bulk Export ──
  ipcMain.handle('customer:export', async (_e, params: CustomerExportParams) => {
    try {
      const result = await exportCustomers(params);
      if (result.success) return ok({ success: true, filePath: result.filePath });
      return fail(result.error || 'Gagal export', 'CUST_EXP_ERR');
    } catch (err: any) {
      return fail(err?.message || 'Gagal export', 'CUST_EXP_ERR');
    }
  });

  // ── Bulk Import ──
  ipcMain.handle('customer:import-preview', async (_e, data: Uint8Array) => {
    try {
      const result = await previewImportFromBuffer(Buffer.from(data));
      return ok(result);
    } catch (err: any) {
      return fail(err?.message || 'Gagal membaca file', 'CUST_IMP_ERR');
    }
  });

  ipcMain.handle('customer:import-commit', async (_e, rows: CustomerImportRow[]) => {
    try {
      const result = await commitImport(rows);
      return ok(result);
    } catch (err: any) {
      return fail(err?.message || 'Gagal mengimport', 'CUST_IMP_ERR');
    }
  });
}
