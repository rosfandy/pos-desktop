import { ipcMain } from 'electron';
import { exportProducts } from '../services/product/bulk-export.service.ts';
import type { ExportParams } from '../services/product/bulk-export.service.ts';

function ok<T>(data: T) { return { ok: true as const, data }; }
function fail(message: string, code = 'EXP_ERR') { return { ok: false as const, error: { code, message } }; }

export function registerBulkExportHandlers() {
  ipcMain.handle('product:export', async (_e, params: ExportParams) => {
    try {
      const result = await exportProducts(params);
      if (result.success) {
        return ok({ success: true, filePath: result.filePath });
      }
      return fail(result.error || 'Gagal export');
    } catch (err: any) {
      return fail(err?.message || 'Gagal export');
    }
  });
}
