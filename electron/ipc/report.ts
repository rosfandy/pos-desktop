import { ipcMain } from 'electron';
import { getSalesReport, getStockReport, getFinanceReport } from '../services/report/service.ts';

function ok<T>(data: T) { return { ok: true, data }; }
function fail(message: string, code = 'RPT_ERR') { return { ok: false, error: { code, message } }; }

export function registerReportHandlers() {
  // Sales report
  ipcMain.handle('report:sales', async (_e, params: { startDate: number; endDate: number }) => {
    try {
      if (!params?.startDate || !params?.endDate) return fail('Parameter tanggal tidak valid', 'RPT_001');
      if (params.startDate > params.endDate) return fail('Rentang tanggal tidak valid', 'RPT_001');
      const data = await getSalesReport(params);
      return ok(data);
    } catch (err: any) {
      return fail(err?.message || 'Gagal memuat laporan penjualan');
    }
  });

  // Stock report
  ipcMain.handle('report:stock', async () => {
    try {
      const data = await getStockReport();
      return ok(data);
    } catch (err: any) {
      return fail(err?.message || 'Gagal memuat laporan stok');
    }
  });

  // Finance report
  ipcMain.handle('report:finance', async (_e, params: { startDate: number; endDate: number }) => {
    try {
      if (!params?.startDate || !params?.endDate) return fail('Parameter tanggal tidak valid', 'RPT_001');
      if (params.startDate > params.endDate) return fail('Rentang tanggal tidak valid', 'RPT_001');
      const data = await getFinanceReport(params);
      return ok(data);
    } catch (err: any) {
      return fail(err?.message || 'Gagal memuat laporan keuangan');
    }
  });
}
