import { ipcMain } from 'electron';
import { previewImportFromBuffer, commitImport } from '../services/product/bulk-import.service.ts';
import type { ImportRow } from '../services/product/bulk-import.service.ts';

function ok<T>(data: T) { return { ok: true as const, data }; }
function fail(message: string, code = 'IMP_ERR') { return { ok: false as const, error: { code, message } }; }

export function registerBulkImportHandlers() {
  ipcMain.handle('product:import-preview', async (_e, data: Uint8Array) => {
    try {
      const result = await previewImportFromBuffer(Buffer.from(data));
      return ok(result);
    } catch (err: any) {
      return fail(err?.message || 'Gagal membaca file');
    }
  });

  ipcMain.handle('product:import-commit', async (_e, rows: ImportRow[]) => {
    try {
      const result = await commitImport(rows);
      return ok(result);
    } catch (err: any) {
      return fail(err?.message || 'Gagal mengimport');
    }
  });
}
