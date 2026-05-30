import { ipcMain } from 'electron';
import { previewImportFromBuffer, commitImport } from '../services/customer/bulk-import.service.ts';
import type { CustomerImportRow } from '../services/customer/bulk-import.service.ts';

function ok<T>(data: T) { return { ok: true as const, data }; }
function fail(message: string, code = 'CUST_IMP_ERR') { return { ok: false as const, error: { code, message } }; }

export function registerCustomerBulkImportHandlers() {
  ipcMain.handle('customer:import-preview', async (_e, data: Uint8Array) => {
    try {
      const result = await previewImportFromBuffer(Buffer.from(data));
      return ok(result);
    } catch (err: any) {
      return fail(err?.message || 'Gagal membaca file');
    }
  });

  ipcMain.handle('customer:import-commit', async (_e, rows: CustomerImportRow[]) => {
    try {
      const result = await commitImport(rows);
      return ok(result);
    } catch (err: any) {
      return fail(err?.message || 'Gagal mengimport');
    }
  });
}
