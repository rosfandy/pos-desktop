import { ipcMain } from 'electron';
import { exportCustomers } from '../services/customer/bulk-export.service.ts';
import type { CustomerExportParams } from '../services/customer/bulk-export.service.ts';

function ok<T>(data: T) { return { ok: true as const, data }; }
function fail(message: string, code = 'CUST_EXP_ERR') { return { ok: false as const, error: { code, message } }; }

export function registerCustomerBulkExportHandlers() {
  ipcMain.handle('customer:export', async (_e, params: CustomerExportParams) => {
    try {
      const result = await exportCustomers(params);
      if (result.success) {
        return ok({ success: true, filePath: result.filePath });
      }
      return fail(result.error || 'Gagal export');
    } catch (err: any) {
      return fail(err?.message || 'Gagal export');
    }
  });
}
