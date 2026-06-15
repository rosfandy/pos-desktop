import { ipcMain } from 'electron';
import { recordCashFlow, listCashFlows, getShiftCashFlowSummary, listCashFlowsByDate } from './service.ts';

export function registerCashFlowHandlers(): void {
  // Record cash out (kas keluar)
  ipcMain.handle('cashFlow:recordOut', async (_event, dto: { shiftId: string; amount: number; reason: string; userId: string }) => {
    try {
      const result = await recordCashFlow({
        ...dto,
        type: 'out',
      });
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CASH_FLOW_ERR', message: err.message } };
    }
  });

  // Record cash in (kas masuk — selain penjualan)
  ipcMain.handle('cashFlow:recordIn', async (_event, dto: { shiftId: string; amount: number; reason: string; userId: string }) => {
    try {
      const result = await recordCashFlow({
        ...dto,
        type: 'in',
      });
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CASH_FLOW_ERR', message: err.message } };
    }
  });

  // List cash flows for a shift
  ipcMain.handle('cashFlow:list', async (_event, shiftId: string) => {
    try {
      const result = await listCashFlows(shiftId);
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CASH_FLOW_ERR', message: err.message } };
    }
  });

  // Get cash flow summary for a shift
  ipcMain.handle('cashFlow:summary', async (_event, shiftId: string) => {
    try {
      const result = await getShiftCashFlowSummary(shiftId);
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CASH_FLOW_ERR', message: err.message } };
    }
  });

  // List cash flows by date range (for reports)
  ipcMain.handle('cashFlow:listByDate', async (_event, params: { startDate: number; endDate: number }) => {
    try {
      const result = await listCashFlowsByDate(params.startDate, params.endDate);
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, error: { code: 'CASH_FLOW_ERR', message: err.message } };
    }
  });
}
